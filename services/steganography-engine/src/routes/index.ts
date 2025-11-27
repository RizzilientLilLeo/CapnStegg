import { Router } from 'express';
import multer from 'multer';
import { encodeController, capacityController } from '../controllers/encode.controller';
import { decodeController, checkController } from '../controllers/decode.controller';
import config from '../config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter: (_req, file, cb) => {
    // Accept common image mime types
    const allowedMimes = [
      'image/png',
      'image/bmp',
      'image/tiff',
      'image/x-ms-bmp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Encoding endpoints
router.post('/encode', upload.single('image'), encodeController);
router.post('/capacity', upload.single('image'), capacityController);

// Decoding endpoints
router.post('/decode', upload.single('image'), decodeController);
router.post('/check', upload.single('image'), checkController);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Supported formats endpoint
router.get('/supported-formats', (_req, res) => {
  res.json({
    success: true,
    data: {
      formats: config.supportedFormats,
      recommended: 'png',
      maxFileSize: config.maxFileSize,
      maxFileSizeHuman: `${Math.round(config.maxFileSize / 1024 / 1024)}MB`
    },
    metadata: {
      timestamp: new Date().toISOString(),
      service: config.serviceName
    }
  });
});

export default router;
