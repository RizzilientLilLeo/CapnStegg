import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  anonymizeIPs: process.env.ANONYMIZE_IPS !== 'false', // Default true
  enableGeolocation: process.env.ENABLE_GEOLOCATION === 'true', // Default false
  databasePath: process.env.DATABASE_PATH || './data/ip-capture.db',
  serviceName: process.env.SERVICE_NAME || 'ip-capture',
  version: '1.0.0'
};

export default config;
