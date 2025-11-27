import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { decode, hasHiddenData } from '../services/decoder.service';
import { ServiceResponse, DecodedResult } from '../types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Handle image decoding requests
 */
export async function decodeController(req: Request, res: Response): Promise<void> {
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
    
    const password = req.body.password;
    
    const result = await decode(req.file.buffer, password);
    
    const duration = Date.now() - startTime;
    logger.info('Decode request completed', {
      requestId,
      duration,
      messageLength: result.metadata.length,
      encrypted: result.metadata.encrypted
    });
    
    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<DecodedResult>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Decode request failed', { requestId, error: errorMessage });
    
    res.status(400).json({
      success: false,
      error: {
        code: 'DECODING_FAILED',
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
 * Check if an image contains hidden data
 */
export async function checkController(req: Request, res: Response): Promise<void> {
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
    
    const hasData = await hasHiddenData(req.file.buffer);
    
    res.json({
      success: true,
      data: { hasHiddenData: hasData },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<{ hasHiddenData: boolean }>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Check request failed', { requestId, error: errorMessage });
    
    res.status(400).json({
      success: false,
      error: {
        code: 'CHECK_FAILED',
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
