import { createApp } from './app';
import { closeRepository } from './repositories';
import config from './config';
import logger from './utils/logger';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`${config.serviceName} started`, {
    port: config.port,
    environment: config.nodeEnv,
    version: config.version,
    anonymizeIPs: config.anonymizeIPs
  });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    logger.info('Server closed');
    closeRepository();
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    closeRepository();
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
