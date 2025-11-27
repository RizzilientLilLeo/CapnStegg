import Jimp from 'jimp';
import { getLSB, binaryTo32BitNumber } from '../utils/bit.utils';
import { decrypt } from './encryption.service';
import { validateImage, MESSAGE_LENGTH_BITS, ENCRYPTION_FLAG_BITS, HEADER_BITS, RGB_CHANNELS } from './validation.service';
import { DecodedResult } from '../types';
import logger from '../utils/logger';

/**
 * Decode a hidden message from an image using LSB steganography
 */
export async function decode(
  imageBuffer: Buffer,
  password?: string
): Promise<DecodedResult> {
  const startTime = Date.now();
  
  // Validate the image
  const validation = await validateImage(imageBuffer);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const image = await Jimp.read(imageBuffer);
  const width = image.getWidth();
  const height = image.getHeight();
  
  // Extract bits from image
  let extractedBits = '';
  let messageLength = 0;
  let isEncrypted = false;
  let headerRead = false;
  let bitsNeeded = HEADER_BITS; // MESSAGE_LENGTH_BITS + ENCRYPTION_FLAG_BITS
  
  image.scan(0, 0, width, height, function(x, y, idx) {
    if (extractedBits.length < bitsNeeded) {
      // Red channel
      extractedBits += getLSB(this.bitmap.data[idx]);
      
      // Green channel
      if (extractedBits.length < bitsNeeded) {
        extractedBits += getLSB(this.bitmap.data[idx + 1]);
      }
      
      // Blue channel
      if (extractedBits.length < bitsNeeded) {
        extractedBits += getLSB(this.bitmap.data[idx + 2]);
      }
      
      // Once we have the header, calculate total bits needed
      if (!headerRead && extractedBits.length >= HEADER_BITS) {
        messageLength = binaryTo32BitNumber(extractedBits.substring(0, MESSAGE_LENGTH_BITS));
        isEncrypted = extractedBits.substring(MESSAGE_LENGTH_BITS, HEADER_BITS) !== '00000000';
        bitsNeeded = HEADER_BITS + (messageLength * 8);
        headerRead = true;
        
        // Sanity check for message length
        const maxBytes = (width * height * RGB_CHANNELS) / 8 - (HEADER_BITS / 8);
        if (messageLength <= 0 || messageLength > maxBytes) {
          throw new Error('No valid hidden message found in this image');
        }
      }
    }
  });
  
  if (!headerRead || messageLength === 0) {
    throw new Error('No hidden message found in this image');
  }
  
  // Extract the message bytes
  const messageBits = extractedBits.substring(HEADER_BITS, HEADER_BITS + (messageLength * 8));
  const messageBytes: number[] = [];
  
  for (let i = 0; i < messageBits.length; i += 8) {
    const byte = messageBits.slice(i, i + 8);
    if (byte.length === 8) {
      messageBytes.push(parseInt(byte, 2));
    }
  }
  
  const messageBuffer = Buffer.from(messageBytes);
  
  // Decrypt if necessary
  let message: string;
  if (isEncrypted) {
    if (!password) {
      throw new Error('This message is encrypted. Please provide a password to decrypt.');
    }
    try {
      message = decrypt(messageBuffer, password);
    } catch (error) {
      throw new Error('Failed to decrypt message. Invalid password or corrupted data.');
    }
  } else {
    message = messageBuffer.toString('utf8');
  }
  
  const duration = Date.now() - startTime;
  logger.info('Decoding completed', {
    duration,
    messageLength,
    encrypted: isEncrypted
  });
  
  return {
    message,
    metadata: {
      length: message.length,
      encrypted: isEncrypted
    }
  };
}

/**
 * Check if an image contains hidden data (quick check)
 */
export async function hasHiddenData(imageBuffer: Buffer): Promise<boolean> {
  try {
    const validation = await validateImage(imageBuffer);
    if (!validation.valid) {
      return false;
    }
    
    const image = await Jimp.read(imageBuffer);
    let extractedBits = '';
    
    // Read just enough bits to get the length
    image.scan(0, 0, image.getWidth(), image.getHeight(), function(x, y, idx) {
      if (extractedBits.length < MESSAGE_LENGTH_BITS) {
        extractedBits += getLSB(this.bitmap.data[idx]);
        if (extractedBits.length < MESSAGE_LENGTH_BITS) {
          extractedBits += getLSB(this.bitmap.data[idx + 1]);
        }
        if (extractedBits.length < MESSAGE_LENGTH_BITS) {
          extractedBits += getLSB(this.bitmap.data[idx + 2]);
        }
      }
    });
    
    const length = binaryTo32BitNumber(extractedBits);
    const maxBytes = (image.getWidth() * image.getHeight() * RGB_CHANNELS) / 8 - (HEADER_BITS / 8);
    
    return length > 0 && length <= maxBytes;
  } catch {
    return false;
  }
}
