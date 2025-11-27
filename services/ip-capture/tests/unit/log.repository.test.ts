import path from 'path';
import fs from 'fs';
import { LogRepository } from '../../src/repositories/log.repository';
import { LogEntry } from '../../src/types';

describe('LogRepository', () => {
  let repository: LogRepository;
  const testDbPath = path.join(__dirname, '../fixtures/test.db');

  beforeEach(() => {
    // Ensure clean state
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    repository = new LogRepository(testDbPath);
  });

  afterEach(() => {
    repository.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('save', () => {
    it('should save a log entry', () => {
      const entry: LogEntry = {
        id: 'test-id-1',
        ipHash: 'abc123',
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0',
        referrer: 'https://example.com',
        metadata: JSON.stringify({ test: true })
      };

      const saved = repository.save(entry);
      expect(saved.id).toBe(entry.id);
    });

    it('should save multiple entries', () => {
      for (let i = 0; i < 5; i++) {
        repository.save({
          id: `test-id-${i}`,
          ipHash: `hash-${i}`,
          timestamp: new Date().toISOString(),
          userAgent: null,
          referrer: null,
          metadata: null
        });
      }

      const count = repository.getRecordCount();
      expect(count).toBe(5);
    });
  });

  describe('findById', () => {
    it('should find an entry by ID', () => {
      const entry: LogEntry = {
        id: 'find-test-1',
        ipHash: 'xyz789',
        timestamp: new Date().toISOString(),
        userAgent: 'Test Agent',
        referrer: null,
        metadata: null
      };

      repository.save(entry);
      const found = repository.findById('find-test-1');

      expect(found).not.toBeNull();
      expect(found?.id).toBe(entry.id);
      expect(found?.ipHash).toBe(entry.ipHash);
    });

    it('should return null for non-existent ID', () => {
      const found = repository.findById('non-existent');
      expect(found).toBeFalsy();
    });
  });

  describe('find', () => {
    beforeEach(() => {
      // Add test data
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        repository.save({
          id: `find-all-${i}`,
          ipHash: i % 2 === 0 ? 'hash-even' : 'hash-odd',
          timestamp: timestamp.toISOString(),
          userAgent: `Agent ${i}`,
          referrer: null,
          metadata: null
        });
      }
    });

    it('should find all entries without criteria', () => {
      const results = repository.find({});
      expect(results.length).toBe(10);
    });

    it('should limit results', () => {
      const results = repository.find({ limit: 5 });
      expect(results.length).toBe(5);
    });

    it('should filter by IP hash', () => {
      const results = repository.find({ ipHash: 'hash-even' });
      expect(results.length).toBe(5);
      results.forEach(r => expect(r.ipHash).toBe('hash-even'));
    });

    it('should paginate with offset', () => {
      const page1 = repository.find({ limit: 3, offset: 0 });
      const page2 = repository.find({ limit: 3, offset: 3 });

      expect(page1.length).toBe(3);
      expect(page2.length).toBe(3);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should filter by date range', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const results = repository.find({
        startDate: threeDaysAgo,
        endDate: now
      });

      expect(results.length).toBeLessThanOrEqual(4);
    });
  });

  describe('delete', () => {
    it('should delete an entry by ID', () => {
      repository.save({
        id: 'delete-test',
        ipHash: 'hash',
        timestamp: new Date().toISOString(),
        userAgent: null,
        referrer: null,
        metadata: null
      });

      const deleted = repository.delete('delete-test');
      expect(deleted).toBe(true);

      const found = repository.findById('delete-test');
      expect(found).toBeFalsy();
    });

    it('should return false when deleting non-existent entry', () => {
      const deleted = repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteAll', () => {
    it('should delete all entries', () => {
      for (let i = 0; i < 5; i++) {
        repository.save({
          id: `delete-all-${i}`,
          ipHash: 'hash',
          timestamp: new Date().toISOString(),
          userAgent: null,
          referrer: null,
          metadata: null
        });
      }

      const deleted = repository.deleteAll();
      expect(deleted).toBe(5);
      expect(repository.getRecordCount()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const now = new Date();
      
      // Add entries at different times
      repository.save({
        id: 'stats-1',
        ipHash: 'unique-1',
        timestamp: now.toISOString(),
        userAgent: null,
        referrer: null,
        metadata: null
      });

      repository.save({
        id: 'stats-2',
        ipHash: 'unique-1', // Same IP hash
        timestamp: now.toISOString(),
        userAgent: null,
        referrer: null,
        metadata: null
      });

      repository.save({
        id: 'stats-3',
        ipHash: 'unique-2', // Different IP hash
        timestamp: now.toISOString(),
        userAgent: null,
        referrer: null,
        metadata: null
      });

      const stats = repository.getStats();

      expect(stats.totalCaptures).toBe(3);
      expect(stats.uniqueIPs).toBe(2);
      expect(stats.capturesLast24h).toBe(3);
      expect(stats.capturesLastWeek).toBe(3);
    });
  });

  describe('getRecordCount', () => {
    it('should return 0 for empty database', () => {
      expect(repository.getRecordCount()).toBe(0);
    });

    it('should return correct count after adding entries', () => {
      repository.save({
        id: 'count-1',
        ipHash: 'hash',
        timestamp: new Date().toISOString(),
        userAgent: null,
        referrer: null,
        metadata: null
      });

      expect(repository.getRecordCount()).toBe(1);
    });
  });
});
