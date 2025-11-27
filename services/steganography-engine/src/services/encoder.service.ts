import Jimp from 'jimp';
import { setLSB, stringToBinary, numberTo32BitBinary } from '../utils/bit.utils';
import { encrypt, getEncryptionOverhead } from './encryption.service';
import { validateImage, calculateCapacity } from './validation.service';
import { EncodedResult, CapacityInfo } from '../types';
import logger from '../utils/logger';

/**
 * Encode a message into an image using LSB steganography
 */
export async function encode(
  imageBuffer: Buffer,
  message: string,
  password?: string
): Promise<EncodedResult> {
  const startTime = Date.now();
  
  // Validate the image
  const validation = await validateImage(imageBuffer);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const image = await Jimp.read(imageBuffer);
  const width = image.getWidth();
  const height = image.getHeight();
  
  // Prepare the message (encrypt if password provided)
  let dataToEncode: Buffer;
  const isEncrypted = !!password;
  
  if (password) {
    dataToEncode = encrypt(message, password);
  } else {
    dataToEncode = Buffer.from(message, 'utf8');
  }
  
  // Check capacity
  const capacity = calculateCapacity(width, height);
  if (dataToEncode.length > capacity) {
    throw new Error(
      `Message too large. Message size: ${dataToEncode.length} bytes, available capacity: ${capacity} bytes`
    );
  }
  
  // Convert data to binary with length prefix
  const lengthBinary = numberTo32BitBinary(dataToEncode.length);
  const dataBinary = Array.from(dataToEncode)
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');
  const encryptedFlag = isEncrypted ? '1' : '0';
  const fullBinary = lengthBinary + encryptedFlag.padStart(8, '0') + dataBinary;
  
  let bitIndex = 0;
  
  // Embed data into image pixels
  image.scan(0, 0, width, height, function(x, y, idx) {
    if (bitIndex < fullBinary.length) {
      // Red channel
      if (bitIndex < fullBinary.length) {
        const bit = parseInt(fullBinary[bitIndex], 10);
        this.bitmap.data[idx] = setLSB(this.bitmap.data[idx], bit);
        bitIndex++;
      }
      
      // Green channel
      if (bitIndex < fullBinary.length) {
        const bit = parseInt(fullBinary[bitIndex], 10);
        this.bitmap.data[idx + 1] = setLSB(this.bitmap.data[idx + 1], bit);
        bitIndex++;
      }
      
      // Blue channel
      if (bitIndex < fullBinary.length) {
        const bit = parseInt(fullBinary[bitIndex], 10);
        this.bitmap.data[idx + 2] = setLSB(this.bitmap.data[idx + 2], bit);
        bitIndex++;
      }
    }
  });
  
  // Get the encoded image as PNG (lossless format)
  const encodedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
  
  const duration = Date.now() - startTime;
  logger.info('Encoding completed', {
    duration,
    bytesUsed: dataToEncode.length,
    capacity,
    encrypted: isEncrypted
  });
  
  return {
    image: encodedBuffer,
    format: 'png',
    bytesUsed: dataToEncode.length,
    capacity
  };
}

/**
 * Get the capacity information for an image
 */
export async function getCapacity(imageBuffer: Buffer): Promise<CapacityInfo> {
  const validation = await validateImage(imageBuffer);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const totalBytes = (validation.width! * validation.height! * 3) / 8;
  const availableBytes = calculateCapacity(validation.width!, validation.height!);
  const encryptionOverhead = getEncryptionOverhead();
  
  return {
    totalBytes,
    availableBytes,
    maxMessageLength: availableBytes - encryptionOverhead
  };
}
