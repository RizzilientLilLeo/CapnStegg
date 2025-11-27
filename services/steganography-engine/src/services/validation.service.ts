import Jimp from 'jimp';
import config from '../config';
import logger from '../utils/logger';

// Constants for steganography header
export const RGB_CHANNELS = 3;
export const MESSAGE_LENGTH_BITS = 32;
export const ENCRYPTION_FLAG_BITS = 8;
export const HEADER_BITS = MESSAGE_LENGTH_BITS + ENCRYPTION_FLAG_BITS;

export interface ValidationResult {
  valid: boolean;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Validate an image buffer for steganography operations
 */
export async function validateImage(imageBuffer: Buffer): Promise<ValidationResult> {
  try {
    const image = await Jimp.read(imageBuffer);
    const mime = image.getMIME();
    
    // Map MIME type to our supported formats
    let format: string;
    switch (mime) {
      case Jimp.MIME_PNG:
        format = 'png';
        break;
      case Jimp.MIME_BMP:
        format = 'bmp';
        break;
      case Jimp.MIME_TIFF:
        format = 'tiff';
        break;
      default:
        return {
          valid: false,
          error: `Unsupported image format: ${mime}. Supported formats: ${config.supportedFormats.join(', ')}`
        };
    }
    
    // Check file size
    if (imageBuffer.length > config.maxFileSize) {
      return {
        valid: false,
        error: `Image size (${imageBuffer.length} bytes) exceeds maximum allowed (${config.maxFileSize} bytes)`
      };
    }
    
    return {
      valid: true,
      format,
      width: image.getWidth(),
      height: image.getHeight()
    };
  } catch (error) {
    logger.error('Image validation failed', { error });
    return {
      valid: false,
      error: 'Failed to process image. Please ensure it is a valid image file.'
    };
  }
}

/**
 * Calculate the maximum message capacity for an image
 */
export function calculateCapacity(width: number, height: number): number {
  // Each pixel has RGB_CHANNELS color channels, each can store 1 bit
  // We reserve HEADER_BITS for message length and encryption flag
  const totalBits = width * height * RGB_CHANNELS;
  const availableBits = totalBits - HEADER_BITS;
  return Math.floor(availableBits / 8); // Convert to bytes
}
