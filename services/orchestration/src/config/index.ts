import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  serviceName: process.env.SERVICE_NAME || 'orchestration',
  version: '1.0.0',
  
  // Backend services
  steganographyServiceUrl: process.env.STEGANOGRAPHY_SERVICE_URL || 'http://localhost:3001',
  ipCaptureServiceUrl: process.env.IP_CAPTURE_SERVICE_URL || 'http://localhost:3002',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10), // seconds
  
  // Service timeouts
  serviceTimeout: parseInt(process.env.SERVICE_TIMEOUT || '30000', 10), // milliseconds
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10)
};

export const services = {
  steganography: {
    name: 'steganography-engine',
    url: config.steganographyServiceUrl,
    healthEndpoint: '/health',
    timeout: config.serviceTimeout
  },
  ipCapture: {
    name: 'ip-capture',
    url: config.ipCaptureServiceUrl,
    healthEndpoint: '/health',
    timeout: config.serviceTimeout
  }
};

export default config;
