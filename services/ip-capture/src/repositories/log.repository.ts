import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config';
import logger from '../utils/logger';
import { LogEntry, SearchCriteria, CaptureStats } from '../types';

export class LogRepository {
  private db: Database.Database;
  private initialized: boolean = false;

  constructor(dbPath?: string) {
    const databasePath = dbPath || config.databasePath;
    
    // Ensure directory exists
    const dir = path.dirname(databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(databasePath);
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ip_logs (
        id TEXT PRIMARY KEY,
        ip_hash TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        user_agent TEXT,
        referrer TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_ip_logs_timestamp ON ip_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_hash ON ip_logs(ip_hash);
    `);

    this.initialized = true;
    logger.info('Database initialized');
  }

  save(entry: LogEntry): LogEntry {
    const stmt = this.db.prepare(`
      INSERT INTO ip_logs (id, ip_hash, timestamp, user_agent, referrer, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.id,
      entry.ipHash,
      entry.timestamp,
      entry.userAgent,
      entry.referrer,
      entry.metadata
    );

    logger.debug('Log entry saved', { id: entry.id });
    return entry;
  }

  findById(id: string): LogEntry | null {
    const stmt = this.db.prepare(`
      SELECT id, ip_hash as ipHash, timestamp, user_agent as userAgent, 
             referrer, metadata
      FROM ip_logs
      WHERE id = ?
    `);

    return stmt.get(id) as LogEntry | null;
  }

  find(criteria: SearchCriteria): LogEntry[] {
    let query = `
      SELECT id, ip_hash as ipHash, timestamp, user_agent as userAgent,
             referrer, metadata
      FROM ip_logs
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (criteria.startDate) {
      query += ' AND timestamp >= ?';
      params.push(criteria.startDate.toISOString());
    }

    if (criteria.endDate) {
      query += ' AND timestamp <= ?';
      params.push(criteria.endDate.toISOString());
    }

    if (criteria.ipHash) {
      query += ' AND ip_hash = ?';
      params.push(criteria.ipHash);
    }

    query += ' ORDER BY timestamp DESC';

    if (criteria.limit) {
      query += ' LIMIT ?';
      params.push(criteria.limit);
    }

    if (criteria.offset) {
      query += ' OFFSET ?';
      params.push(criteria.offset);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as LogEntry[];
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM ip_logs WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteAll(): number {
    const stmt = this.db.prepare('DELETE FROM ip_logs');
    const result = stmt.run();
    return result.changes;
  }

  getStats(): CaptureStats {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM ip_logs');
    const uniqueStmt = this.db.prepare('SELECT COUNT(DISTINCT ip_hash) as count FROM ip_logs');
    
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const last24hStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM ip_logs WHERE timestamp >= ?'
    );
    const lastWeekStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM ip_logs WHERE timestamp >= ?'
    );

    const total = totalStmt.get() as { count: number };
    const unique = uniqueStmt.get() as { count: number };
    const captures24h = last24hStmt.get(last24h.toISOString()) as { count: number };
    const capturesWeek = lastWeekStmt.get(lastWeek.toISOString()) as { count: number };

    return {
      totalCaptures: total.count,
      uniqueIPs: unique.count,
      capturesLast24h: captures24h.count,
      capturesLastWeek: capturesWeek.count
    };
  }

  getRecordCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM ip_logs');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }
}

// Default singleton instance
let defaultRepository: LogRepository | null = null;

export function getLogRepository(): LogRepository {
  if (!defaultRepository) {
    defaultRepository = new LogRepository();
  }
  return defaultRepository;
}

export function closeRepository(): void {
  if (defaultRepository) {
    defaultRepository.close();
    defaultRepository = null;
  }
}
