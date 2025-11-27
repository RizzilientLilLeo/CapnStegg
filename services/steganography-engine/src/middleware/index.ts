import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { ServiceError, ServiceResponse } from '../types';

export interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Adds a unique request ID to each request
 */
export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

/**
 * Logs incoming requests
 */
export function requestLoggingMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    });
  });

  next();
}

/**
 * Global error handler
 */
export function errorHandler(
  err: Error,
  req: RequestWithId,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack
  });

  const serviceError: ServiceError = {
    code: 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  const response: ServiceResponse<null> = {
    success: false,
    error: serviceError,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      service: 'steganography-engine'
    }
  };

  res.status(500).json(response);
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(
  req: RequestWithId,
  res: Response
): void {
  const response: ServiceResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      service: 'steganography-engine'
    }
  };

  res.status(404).json(response);
}
