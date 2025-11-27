import sharp from 'sharp';
import logger from '../utils/logger';
import { encryptionService } from './encryption.service';
import { 
  EncodeResult, 
  DecodeResult, 
  CapacityResult, 
  MessageMetadata,
  SUPPORTED_FORMATS 
} from '../types';

// Magic bytes to identify our encoded data
const MAGIC_HEADER = Buffer.from([0x43, 0x41, 0x50, 0x4E]); // "CAPN"
const HEADER_SIZE = 4 + 4 + 1; // Magic (4) + Length (4) + Encrypted flag (1)

export class SteganographyService {
  /**
   * Calculates how many bytes can be hidden in an image
   */
  async getCapacity(imageBuffer: Buffer): Promise<CapacityResult> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height || !metadata.channels) {
        throw new Error('Unable to read image metadata');
      }

      // Each pixel can hold 1 bit per channel in LSB
      // We use 3 channels (RGB), so 3 bits per pixel = 3/8 bytes per pixel
      const totalPixels = metadata.width * metadata.height;
      const usableChannels = Math.min(metadata.channels, 3); // Only use RGB
      const totalCapacityBits = totalPixels * usableChannels;
      const totalCapacity = Math.floor(totalCapacityBits / 8);
      
      // Reserve space for header
      const availableBytes = totalCapacity - HEADER_SIZE;

      return {
        totalCapacity,
        availableBytes: Math.max(0, availableBytes),
        format: metadata.format || 'unknown',
        dimensions: {
          width: metadata.width,
          height: metadata.height
        }
      };
    } catch (error) {
      logger.error('Failed to calculate capacity', { error });
      throw new Error('Failed to calculate image capacity');
    }
  }

  /**
   * Encodes a message into an image using LSB steganography
   */
  async encode(
    imageBuffer: Buffer,
    message: string,
    password?: string
  ): Promise<EncodeResult> {
    try {
      // Prepare message payload
      let payload: Buffer;
      const isEncrypted = !!password;

      if (password) {
        payload = encryptionService.encrypt(message, password);
      } else {
        payload = Buffer.from(message, 'utf8');
      }

      // Check capacity
      const capacity = await this.getCapacity(imageBuffer);
      if (payload.length > capacity.availableBytes) {
        throw new Error(
          `Message too large. Maximum: ${capacity.availableBytes} bytes, Got: ${payload.length} bytes`
        );
      }

      // Build the data to hide: header + payload
      const header = Buffer.alloc(HEADER_SIZE);
      MAGIC_HEADER.copy(header, 0);
      header.writeUInt32BE(payload.length, 4);
      header.writeUInt8(isEncrypted ? 1 : 0, 8);

      const dataToHide = Buffer.concat([header, payload]);

      // Convert image to raw RGBA buffer
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image dimensions');
      }

      // Ensure we work with a lossless format (PNG)
      const rawBuffer = await image
        .ensureAlpha()
        .raw()
        .toBuffer();

      // Embed the data using LSB
      const modifiedBuffer = this.embedData(rawBuffer, dataToHide);

      // Convert back to PNG (lossless format)
      const outputBuffer = await sharp(modifiedBuffer, {
        raw: {
          width: metadata.width,
          height: metadata.height,
          channels: 4
        }
      })
        .png({ compressionLevel: 9 })
        .toBuffer();

      logger.info('Message encoded successfully', {
        messageLength: payload.length,
        encrypted: isEncrypted,
        imageWidth: metadata.width,
        imageHeight: metadata.height
      });

      return {
        success: true,
        imageBuffer: outputBuffer,
        format: 'png',
        bytesUsed: dataToHide.length,
        capacity: capacity.availableBytes
      };
    } catch (error) {
      logger.error('Encoding failed', { error });
      throw error;
    }
  }

  /**
   * Decodes a hidden message from an image
   */
  async decode(imageBuffer: Buffer, password?: string): Promise<DecodeResult> {
    try {
      // Convert image to raw buffer
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      const rawBuffer = await image
        .ensureAlpha()
        .raw()
        .toBuffer();

      // Extract header first
      const header = this.extractData(rawBuffer, HEADER_SIZE, 0);

      // Verify magic header
      if (!header.subarray(0, 4).equals(MAGIC_HEADER)) {
        throw new Error('No hidden message found or invalid format');
      }

      const payloadLength = header.readUInt32BE(4);
      const isEncrypted = header.readUInt8(8) === 1;

      // Validate payload length
      const capacity = await this.getCapacity(imageBuffer);
      if (payloadLength > capacity.availableBytes) {
        throw new Error('Invalid payload length - corrupted data');
      }

      // Extract payload
      const payload = this.extractData(rawBuffer, payloadLength, HEADER_SIZE);

      // Decrypt if needed
      let message: string;
      if (isEncrypted) {
        if (!password) {
          throw new Error('Password required to decode encrypted message');
        }
        message = encryptionService.decrypt(payload, password);
      } else {
        message = payload.toString('utf8');
      }

      const resultMetadata: MessageMetadata = {
        length: message.length,
        encrypted: isEncrypted,
        timestamp: new Date().toISOString()
      };

      logger.info('Message decoded successfully', {
        messageLength: message.length,
        encrypted: isEncrypted
      });

      return {
        success: true,
        message,
        metadata: resultMetadata
      };
    } catch (error) {
      logger.error('Decoding failed', { error });
      throw error;
    }
  }

  /**
   * Embeds data into image buffer using LSB
   */
  private embedData(imageBuffer: Buffer, data: Buffer): Buffer {
    const result = Buffer.from(imageBuffer);
    const dataBits = this.bytesToBits(data);
    
    let bitIndex = 0;
    
    for (let i = 0; i < result.length && bitIndex < dataBits.length; i++) {
      // Skip alpha channel (every 4th byte in RGBA)
      if (i % 4 === 3) continue;
      
      // Clear LSB and set new value
      result[i] = (result[i] & 0xFE) | dataBits[bitIndex];
      bitIndex++;
    }
    
    if (bitIndex < dataBits.length) {
      throw new Error('Image too small to hold the data');
    }
    
    return result;
  }

  /**
   * Extracts data from image buffer using LSB
   */
  private extractData(imageBuffer: Buffer, length: number, offset: number): Buffer {
    const totalBits = length * 8;
    const offsetBits = offset * 8;
    const bits: number[] = [];
    
    let bitIndex = 0;
    let extractedBits = 0;
    
    for (let i = 0; i < imageBuffer.length && extractedBits < totalBits + offsetBits; i++) {
      // Skip alpha channel
      if (i % 4 === 3) continue;
      
      if (bitIndex >= offsetBits) {
        bits.push(imageBuffer[i] & 1);
        extractedBits++;
      }
      bitIndex++;
    }
    
    return this.bitsToBytes(bits.slice(0, totalBits));
  }

  /**
   * Converts bytes to bit array
   */
  private bytesToBits(data: Buffer): number[] {
    const bits: number[] = [];
    for (const byte of data) {
      for (let i = 7; i >= 0; i--) {
        bits.push((byte >> i) & 1);
      }
    }
    return bits;
  }

  /**
   * Converts bit array to bytes
   */
  private bitsToBytes(bits: number[]): Buffer {
    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8 && i + j < bits.length; j++) {
        byte = (byte << 1) | bits[i + j];
      }
      bytes.push(byte);
    }
    return Buffer.from(bytes);
  }

  /**
   * Checks if a format is supported
   */
  isFormatSupported(format: string): boolean {
    return SUPPORTED_FORMATS.includes(format.toLowerCase() as any);
  }

  /**
   * Gets list of supported formats
   */
  getSupportedFormats(): string[] {
    return [...SUPPORTED_FORMATS];
  }
}

export const steganographyService = new SteganographyService();
export default steganographyService;
