import Jimp from 'jimp';
import { validateImage } from './validation.service';
import { CompositeResult } from '../types';
import logger from '../utils/logger';
import config from '../config';

/**
 * Minimum number of images required for composite generation
 */
export const MIN_IMAGES = 2;

/**
 * Maximum number of images allowed for composite generation
 */
export const MAX_IMAGES = 10;

/**
 * Available blend modes for overlaying images
 */
export const BLEND_MODES = [
  Jimp.BLEND_SOURCE_OVER,
  Jimp.BLEND_MULTIPLY,
  Jimp.BLEND_ADD,
  Jimp.BLEND_SCREEN,
  Jimp.BLEND_OVERLAY,
  Jimp.BLEND_DARKEN,
  Jimp.BLEND_LIGHTEN,
  Jimp.BLEND_HARDLIGHT,
  Jimp.BLEND_DIFFERENCE,
  Jimp.BLEND_EXCLUSION,
] as const;

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random rotation angle in degrees
 */
function randomRotation(): number {
  const rotations = [0, 90, 180, 270];
  return rotations[randomInt(0, rotations.length - 1)];
}

/**
 * Get a random blend mode
 */
function randomBlendMode(): string {
  return BLEND_MODES[randomInt(0, BLEND_MODES.length - 1)];
}

/**
 * Generate a random opacity value between 0.3 and 1.0
 */
function randomOpacity(): number {
  return 0.3 + Math.random() * 0.7;
}

/**
 * Validate and process multiple image buffers for compositing
 */
export async function validateImages(imageBuffers: Buffer[]): Promise<void> {
  if (imageBuffers.length < MIN_IMAGES) {
    throw new Error(`At least ${MIN_IMAGES} images are required for compositing`);
  }
  
  if (imageBuffers.length > MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} images allowed for compositing`);
  }
  
  for (let i = 0; i < imageBuffers.length; i++) {
    const validation = await validateImage(imageBuffers[i]);
    if (!validation.valid) {
      throw new Error(`Image ${i + 1}: ${validation.error}`);
    }
    
    // Check for supported formats
    const supportedFormats = config.supportedFormats as readonly string[];
    if (!supportedFormats.includes(validation.format!)) {
      throw new Error(
        `Image ${i + 1}: Unsupported format '${validation.format}'. Supported formats: ${config.supportedFormats.join(', ')}`
      );
    }
  }
}

/**
 * Create a composite image by randomly overlaying multiple images
 */
export async function createComposite(imageBuffers: Buffer[]): Promise<CompositeResult> {
  const startTime = Date.now();
  
  // Validate all images
  await validateImages(imageBuffers);
  
  // Load all images
  const images: Jimp[] = await Promise.all(
    imageBuffers.map(buffer => Jimp.read(buffer))
  );
  
  // Determine the canvas size based on the largest image dimensions
  let maxWidth = 0;
  let maxHeight = 0;
  for (const image of images) {
    maxWidth = Math.max(maxWidth, image.getWidth());
    maxHeight = Math.max(maxHeight, image.getHeight());
  }
  
  logger.debug('Creating composite canvas', { width: maxWidth, height: maxHeight });
  
  // Create a new canvas with white background
  const canvas = new Jimp(maxWidth, maxHeight, 0xFFFFFFFF);
  
  // Process each image with random transformations and overlay onto canvas
  for (let i = 0; i < images.length; i++) {
    const image = images[i].clone();
    
    // Apply random rotation (0, 90, 180, or 270 degrees)
    const rotation = randomRotation();
    if (rotation !== 0) {
      image.rotate(rotation, false);
    }
    
    // Calculate random position within canvas bounds
    const imgWidth = image.getWidth();
    const imgHeight = image.getHeight();
    const maxX = Math.max(0, maxWidth - imgWidth);
    const maxY = Math.max(0, maxHeight - imgHeight);
    const x = randomInt(0, maxX);
    const y = randomInt(0, maxY);
    
    // Get random blend mode and opacity
    const blendMode = randomBlendMode();
    const opacity = randomOpacity();
    
    logger.debug('Overlaying image', {
      index: i + 1,
      rotation,
      x,
      y,
      blendMode,
      opacity: opacity.toFixed(2)
    });
    
    // Composite the image onto the canvas
    canvas.composite(image, x, y, {
      mode: blendMode,
      opacitySource: opacity,
      opacityDest: 1
    });
  }
  
  // Convert to PNG buffer
  const compositeBuffer = await canvas.getBufferAsync(Jimp.MIME_PNG);
  
  const duration = Date.now() - startTime;
  logger.info('Composite creation completed', {
    duration,
    imagesUsed: images.length,
    outputWidth: maxWidth,
    outputHeight: maxHeight,
    outputSize: compositeBuffer.length
  });
  
  return {
    image: compositeBuffer,
    format: 'png',
    width: maxWidth,
    height: maxHeight,
    imagesUsed: images.length
  };
}
