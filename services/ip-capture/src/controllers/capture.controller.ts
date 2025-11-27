import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { captureAndStore } from '../services/capture.service';
import { ServiceResponse, LogEntry } from '../types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Handle IP capture requests
 */
export async function captureController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  
  try {
    const logEntry = captureAndStore(req);
    
    logger.info('Capture request completed', {
      requestId,
      ipHash: logEntry.ipHash
    });
    
    res.json({
      success: true,
      data: {
        id: logEntry.id,
        ipHash: logEntry.ipHash,
        timestamp: logEntry.timestamp,
        captured: true
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<{ id: string; ipHash: string; timestamp: string; captured: boolean }>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Capture request failed', { requestId, error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CAPTURE_FAILED',
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
