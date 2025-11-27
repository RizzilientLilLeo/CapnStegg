import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  serviceName: process.env.SERVICE_NAME || 'steganography-engine',
  supportedFormats: ['png', 'bmp', 'tiff'] as const,
};

export default config;
