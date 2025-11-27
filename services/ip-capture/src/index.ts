import { createApp } from './app';
import config from './config';
import logger from './utils/logger';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`IP Capture Service started`, {
    port: config.port,
    environment: config.nodeEnv,
    logLevel: config.logLevel,
    anonymization: config.anonymizeIps,
    geolocation: config.enableGeolocation
  });
});
