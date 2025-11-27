import Jimp from 'jimp';
import config from '../config';
import logger from '../utils/logger';

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
  // Each pixel has 3 color channels (RGB), each can store 1 bit
  // We reserve 32 bits for message length
  const totalBits = width * height * 3;
  const availableBits = totalBits - 32;
  return Math.floor(availableBits / 8); // Convert to bytes
}
