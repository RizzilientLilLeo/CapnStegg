import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { LogRepository, getLogRepository } from '../repositories';
import { hashIP, extractIP, anonymizeIP } from '../utils/ip.utils';
import config from '../config';
import logger from '../utils/logger';
import { CapturedIP, LogEntry, SearchCriteria, CaptureStats } from '../types';

export class CaptureService {
  private repository: LogRepository;

  constructor(repository?: LogRepository) {
    this.repository = repository || getLogRepository();
  }

  /**
   * Captures IP information from a request
   */
  capture(req: Request): CapturedIP {
    const rawIp = extractIP(req);
    const ipHash = hashIP(rawIp);
    const timestamp = new Date();

    const refererHeader = req.headers['referer'] || req.headers['referrer'];
    const referrer = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader;

    const captured: CapturedIP = {
      id: uuidv4(),
      ipHash,
      rawIp: config.anonymizeIPs ? undefined : rawIp,
      timestamp,
      userAgent: req.headers['user-agent'] || undefined,
      referrer: referrer || undefined,
      metadata: {}
    };

    // Store in database
    const logEntry: LogEntry = {
      id: captured.id,
      ipHash: captured.ipHash,
      timestamp: timestamp.toISOString(),
      userAgent: captured.userAgent || null,
      referrer: captured.referrer || null,
      metadata: JSON.stringify(captured.metadata || {})
    };

    this.repository.save(logEntry);

    logger.info('IP captured', {
      id: captured.id,
      ipHash: captured.ipHash,
      anonymized: config.anonymizeIPs
    });

    return captured;
  }

  /**
   * Gets all logs with optional filtering
   */
  getLogs(criteria?: SearchCriteria): LogEntry[] {
    return this.repository.find(criteria || {});
  }

  /**
   * Gets a specific log entry by ID
   */
  getLog(id: string): LogEntry | null {
    return this.repository.findById(id);
  }

  /**
   * Deletes a specific log entry
   */
  deleteLog(id: string): boolean {
    const deleted = this.repository.delete(id);
    if (deleted) {
      logger.info('Log entry deleted', { id });
    }
    return deleted;
  }

  /**
   * Gets capture statistics
   */
  getStats(): CaptureStats {
    return this.repository.getStats();
  }

  /**
   * Gets the total record count
   */
  getRecordCount(): number {
    return this.repository.getRecordCount();
  }

  /**
   * Utility to hash an IP address
   */
  hashIP(ip: string): string {
    return hashIP(ip);
  }

  /**
   * Utility to anonymize an IP address
   */
  anonymizeIP(ip: string): string {
    return anonymizeIP(ip);
  }
}

export const captureService = new CaptureService();
export default captureService;
