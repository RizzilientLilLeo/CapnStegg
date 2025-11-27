import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';

describe('API Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'steganography-engine');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('GET /supported-formats', () => {
    it('should return supported formats', async () => {
      const response = await request(app).get('/supported-formats');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.formats).toContain('png');
      expect(response.body.data.formats).toContain('bmp');
      expect(response.body.data.formats).toContain('tiff');
      expect(response.body.data.recommended).toBe('png');
    });
  });

  describe('POST /encode', () => {
    it('should return error when no image provided', async () => {
      const response = await request(app)
        .post('/encode')
        .field('message', 'test message');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_IMAGE');
    });

    it('should return error when no message provided', async () => {
      // Create a minimal 1x1 PNG image buffer
      const pngBuffer = createTestPng();
      
      const response = await request(app)
        .post('/encode')
        .attach('image', pngBuffer, 'test.png');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_MESSAGE');
    });
  });

  describe('POST /decode', () => {
    it('should return error when no image provided', async () => {
      const response = await request(app).post('/decode');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_IMAGE');
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

  describe('POST /composite', () => {
    it('should return error when no images provided', async () => {
      const response = await request(app).post('/composite');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_IMAGES');
    });

    it('should return error when only one image provided', async () => {
      const pngBuffer = createTestPng();
      
      const response = await request(app)
        .post('/composite')
        .attach('images', pngBuffer, 'test1.png');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_IMAGES');
    });

    it('should return composite image when valid images provided', async () => {
      const pngBuffer1 = createTestPng();
      const pngBuffer2 = createTestPng();
      
      const response = await request(app)
        .post('/composite')
        .attach('images', pngBuffer1, 'test1.png')
        .attach('images', pngBuffer2, 'test2.png');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('image/png');
      expect(response.headers['x-images-used']).toBe('2');
    });
  });
});

// Helper function to create a minimal valid PNG
function createTestPng(): Buffer {
  // Minimal 1x1 white pixel PNG
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (width: 1, height: 1, bit depth: 8, color type: 2 (RGB))
  const ihdrData = Buffer.from([
    0x00, 0x00, 0x00, 0x01, // width
    0x00, 0x00, 0x00, 0x01, // height
    0x08, // bit depth
    0x02, // color type (RGB)
    0x00, // compression method
    0x00, // filter method
    0x00  // interlace method
  ]);
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = calculateCrc32(Buffer.concat([ihdrType, ihdrData]));
  const ihdrChunk = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);
  
  // IDAT chunk (compressed white pixel)
  const idatData = Buffer.from([
    0x78, 0x9C, 0x62, 0xF8, 0xFF, 0xFF, 0xFF, 0x00, 0x05, 0xFE, 0x02, 0xFE
  ]);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(idatData.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCrc = calculateCrc32(Buffer.concat([idatType, idatData]));
  const idatChunk = Buffer.concat([idatLength, idatType, idatData, idatCrc]);
  
  // IEND chunk
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0, 0);
  const iendType = Buffer.from('IEND');
  const iendCrc = calculateCrc32(iendType);
  const iendChunk = Buffer.concat([iendLength, iendType, iendCrc]);
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 implementation for PNG chunks
function calculateCrc32(data: Buffer): Buffer {
  let crc = 0xFFFFFFFF;
  const table = makeCrcTable();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  crc = (crc ^ 0xFFFFFFFF) >>> 0;
  const result = Buffer.alloc(4);
  result.writeUInt32BE(crc, 0);
  return result;
}

// PNG CRC-32 constants (IEEE 802.3 polynomial)
const CRC32_POLYNOMIAL = 0xEDB88320;  // Reversed polynomial for CRC-32
const CRC_TABLE_SIZE = 256;           // Table for all possible byte values
const BITS_PER_BYTE = 8;              // Bits to process per table entry

function makeCrcTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < CRC_TABLE_SIZE; n++) {
    let c = n;
    for (let k = 0; k < BITS_PER_BYTE; k++) {
      c = c & 1 ? CRC32_POLYNOMIAL ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}
