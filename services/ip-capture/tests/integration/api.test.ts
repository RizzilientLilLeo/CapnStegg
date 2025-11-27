import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';
import { closeDatabase } from '../../src/repositories/log.repository';
import fs from 'fs';
import path from 'path';

describe('API Routes', () => {
  let app: Application;
  const testDbPath = './data/test-ip-capture.db';

  beforeAll(() => {
    // Set test database path
    process.env.DATABASE_PATH = testDbPath;
    app = createApp();
  });

  afterAll(() => {
    // Clean up test database
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const dataDir = path.dirname(testDbPath);
    if (fs.existsSync(dataDir) && fs.readdirSync(dataDir).length === 0) {
      fs.rmdirSync(dataDir);
    }
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'ip-capture');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('features');
    });
  });

  describe('GET /capture', () => {
    it('should capture IP address', async () => {
      const response = await request(app)
        .get('/capture')
        .set('User-Agent', 'Test Agent');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('ipHash');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('captured', true);
    });

    it('should capture IP with X-Forwarded-For header', async () => {
      const response = await request(app)
        .get('/capture')
        .set('X-Forwarded-For', '203.0.113.50');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ipHash');
    });
  });

  describe('GET /logs', () => {
    it('should return empty logs initially', async () => {
      // First capture an IP
      await request(app).get('/capture');
      
      const response = await request(app).get('/logs');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/logs')
        .query({ limit: 10, offset: 0 });
      
      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.offset).toBe(0);
    });
  });

  describe('GET /logs/stats', () => {
    it('should return statistics', async () => {
      const response = await request(app).get('/logs/stats');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalLogs');
    });
  });

  describe('GET /logs/:id', () => {
    it('should return 404 for non-existent log', async () => {
      const response = await request(app).get('/logs/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LOG_NOT_FOUND');
    });

    it('should return log by ID', async () => {
      // First capture an IP
      const captureResponse = await request(app).get('/capture');
      const logId = captureResponse.body.data.id;
      
      const response = await request(app).get(`/logs/${logId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(logId);
    });
  });

  describe('DELETE /logs/:id', () => {
    it('should return 404 for non-existent log', async () => {
      const response = await request(app).delete('/logs/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LOG_NOT_FOUND');
    });

    it('should delete log by ID', async () => {
      // First capture an IP
      const captureResponse = await request(app).get('/capture');
      const logId = captureResponse.body.data.id;
      
      const deleteResponse = await request(app).delete(`/logs/${logId}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.data.deleted).toBe(true);
      
      // Verify it's deleted
      const getResponse = await request(app).get(`/logs/${logId}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
