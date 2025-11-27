import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { encode, getCapacity } from '../services/encoder.service';
import { ServiceResponse, EncodedResult, CapacityInfo } from '../types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Handle image encoding requests
 */
export async function encodeController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'No image file provided'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    const message = req.body.message;
    if (!message) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MESSAGE',
          message: 'No message provided to encode'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    const password = req.body.password;
    
    const result = await encode(req.file.buffer, message, password);
    
    const duration = Date.now() - startTime;
    logger.info('Encode request completed', {
      requestId,
      duration,
      bytesUsed: result.bytesUsed,
      capacity: result.capacity
    });
    
    // Return the encoded image as a file
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="encoded.png"',
      'X-Request-Id': requestId,
      'X-Bytes-Used': result.bytesUsed.toString(),
      'X-Capacity': result.capacity.toString()
    });
    res.send(result.image);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Encode request failed', { requestId, error: errorMessage });
    
    res.status(400).json({
      success: false,
      error: {
        code: 'ENCODING_FAILED',
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

/**
 * Handle capacity check requests
 */
export async function capacityController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'No image file provided'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    const capacity = await getCapacity(req.file.buffer);
    
    res.json({
      success: true,
      data: capacity,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<CapacityInfo>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Capacity check failed', { requestId, error: errorMessage });
    
    res.status(400).json({
      success: false,
      error: {
        code: 'CAPACITY_CHECK_FAILED',
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
