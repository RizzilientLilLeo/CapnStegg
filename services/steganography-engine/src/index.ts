import { createApp } from './app';
import config from './config';
import logger from './utils/logger';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`${config.serviceName} started`, {
    port: config.port,
    environment: config.nodeEnv,
    version: config.version
  });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
