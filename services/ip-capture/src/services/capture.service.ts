import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { hashIP, extractIP } from './anonymization.service';
import { saveLog } from '../repositories/log.repository';
import { CapturedIP, LogEntry } from '../types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Capture IP address from a request
 */
export function captureIP(req: Request): CapturedIP {
  const remoteAddress = req.socket.remoteAddress;
  const xForwardedFor = req.headers['x-forwarded-for'] as string | undefined;
  
  const rawIp = extractIP(remoteAddress, xForwardedFor);
  const ipHash = hashIP(rawIp);
  
  const userAgent = req.headers['user-agent'];
  const referrer = req.headers['referer'] || req.headers['referrer'];
  
  const captured: CapturedIP = {
    id: uuidv4(),
    ipHash,
    timestamp: new Date(),
    userAgent: userAgent as string | undefined,
    referrer: referrer as string | undefined
  };
  
  // Only include raw IP if anonymization is disabled
  if (!config.anonymizeIps) {
    captured.rawIp = rawIp;
  }
  
  logger.info('IP captured', {
    ipHash,
    hasUserAgent: !!userAgent,
    hasReferrer: !!referrer
  });
  
  return captured;
}

/**
 * Capture and store IP address
 */
export function captureAndStore(req: Request): LogEntry {
  const captured = captureIP(req);
  
  const logEntry: LogEntry = {
    id: captured.id,
    ipHash: captured.ipHash,
    timestamp: captured.timestamp.toISOString(),
    userAgent: captured.userAgent,
    referrer: captured.referrer,
    country: captured.geolocation?.country,
    city: captured.geolocation?.city
  };
  
  saveLog(logEntry);
  
  return logEntry;
}

/**
 * Get request metadata for logging
 */
export function getRequestMetadata(req: Request): Record<string, unknown> {
  return {
    method: req.method,
    path: req.path,
    query: req.query,
    protocol: req.protocol,
    secure: req.secure,
    hostname: req.hostname
  };
}
