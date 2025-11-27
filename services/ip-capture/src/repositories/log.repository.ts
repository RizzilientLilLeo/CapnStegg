import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config';
import logger from '../utils/logger';
import { LogEntry, SearchCriteria, PaginatedResult } from '../types';

let db: Database.Database | null = null;

/**
 * Initialize the database connection and create tables
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }
  
  // Ensure data directory exists
  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  db = new Database(config.databasePath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS ip_logs (
      id TEXT PRIMARY KEY,
      ip_hash TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      city TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_ip_logs_timestamp ON ip_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_hash ON ip_logs(ip_hash);
  `);
  
  logger.info('Database initialized', { path: config.databasePath });
  
  return db;
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Save a log entry to the database
 */
export function saveLog(entry: LogEntry): LogEntry {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    INSERT INTO ip_logs (id, ip_hash, timestamp, user_agent, referrer, country, city)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    entry.id,
    entry.ipHash,
    entry.timestamp,
    entry.userAgent || null,
    entry.referrer || null,
    entry.country || null,
    entry.city || null
  );
  
  logger.debug('Log entry saved', { id: entry.id });
  
  return entry;
}

/**
 * Find log entries based on search criteria
 */
export function findLogs(criteria: SearchCriteria): PaginatedResult<LogEntry> {
  const database = getDatabase();
  const limit = Math.min(criteria.limit || 50, config.maxLogsPerRequest);
  const offset = criteria.offset || 0;
  
  let whereClause = '1=1';
  const params: (string | number)[] = [];
  
  if (criteria.startDate) {
    whereClause += ' AND timestamp >= ?';
    params.push(criteria.startDate.toISOString());
  }
  
  if (criteria.endDate) {
    whereClause += ' AND timestamp <= ?';
    params.push(criteria.endDate.toISOString());
  }
  
  if (criteria.ipHash) {
    whereClause += ' AND ip_hash = ?';
    params.push(criteria.ipHash);
  }
  
  // Get total count
  const countStmt = database.prepare(`SELECT COUNT(*) as count FROM ip_logs WHERE ${whereClause}`);
  const countResult = countStmt.get(...params) as { count: number };
  const total = countResult.count;
  
  // Get paginated results
  const selectStmt = database.prepare(`
    SELECT id, ip_hash as ipHash, timestamp, user_agent as userAgent, 
           referrer, country, city
    FROM ip_logs 
    WHERE ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);
  
  const items = selectStmt.all(...params, limit, offset) as LogEntry[];
  
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total
  };
}

/**
 * Find a single log entry by ID
 */
export function findLogById(id: string): LogEntry | null {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT id, ip_hash as ipHash, timestamp, user_agent as userAgent, 
           referrer, country, city
    FROM ip_logs 
    WHERE id = ?
  `);
  
  const result = stmt.get(id) as LogEntry | undefined;
  return result || null;
}

/**
 * Delete a log entry by ID
 */
export function deleteLog(id: string): boolean {
  const database = getDatabase();
  
  const stmt = database.prepare('DELETE FROM ip_logs WHERE id = ?');
  const result = stmt.run(id);
  
  logger.debug('Log entry deleted', { id, deleted: result.changes > 0 });
  
  return result.changes > 0;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * Get database statistics
 */
export function getStats(): { totalLogs: number; oldestLog: string | null; newestLog: string | null } {
  const database = getDatabase();
  
  const countStmt = database.prepare('SELECT COUNT(*) as count FROM ip_logs');
  const countResult = countStmt.get() as { count: number };
  
  const oldestStmt = database.prepare('SELECT MIN(timestamp) as oldest FROM ip_logs');
  const oldestResult = oldestStmt.get() as { oldest: string | null };
  
  const newestStmt = database.prepare('SELECT MAX(timestamp) as newest FROM ip_logs');
  const newestResult = newestStmt.get() as { newest: string | null };
  
  return {
    totalLogs: countResult.count,
    oldestLog: oldestResult.oldest,
    newestLog: newestResult.newest
  };
}
