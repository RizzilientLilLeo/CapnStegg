import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createComposite, MIN_IMAGES, MAX_IMAGES } from '../services/composite.service';
import { ServiceResponse, CompositeResult } from '../types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Handle composite image generation requests
 */
export async function compositeController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  try {
    // Check if files were uploaded
    const files = req.files as Express.Multer.File[] | undefined;
    
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGES',
          message: 'No image files provided'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    if (files.length < MIN_IMAGES) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_IMAGES',
          message: `At least ${MIN_IMAGES} images are required for compositing`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    if (files.length > MAX_IMAGES) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_IMAGES',
          message: `Maximum ${MAX_IMAGES} images allowed for compositing`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    // Extract image buffers from uploaded files
    const imageBuffers = files.map(file => file.buffer);
    
    logger.info('Starting composite generation', {
      requestId,
      imageCount: imageBuffers.length
    });
    
    // Generate the composite image
    const result = await createComposite(imageBuffers);
    
    const duration = Date.now() - startTime;
    logger.info('Composite request completed', {
      requestId,
      duration,
      imagesUsed: result.imagesUsed,
      outputWidth: result.width,
      outputHeight: result.height
    });
    
    // Return the composite image as a file
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="composite.png"',
      'X-Request-Id': requestId,
      'X-Images-Used': result.imagesUsed.toString(),
      'X-Output-Width': result.width.toString(),
      'X-Output-Height': result.height.toString()
    });
    res.send(result.image);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Composite request failed', { requestId, error: errorMessage });
    
    res.status(400).json({
      success: false,
      error: {
        code: 'COMPOSITE_FAILED',
        message: errorMessage
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<never>);
  }
}
