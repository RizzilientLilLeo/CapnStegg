import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  anonymizeIps: process.env.ANONYMIZE_IPS !== 'false',
  enableGeolocation: process.env.ENABLE_GEOLOCATION === 'true',
  databasePath: process.env.DATABASE_PATH || './data/ip-capture.db',
  serviceName: process.env.SERVICE_NAME || 'ip-capture',
  maxLogsPerRequest: parseInt(process.env.MAX_LOGS_PER_REQUEST || '100', 10),
};

export default config;
