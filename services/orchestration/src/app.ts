import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import {
  requestIdMiddleware,
  requestLoggingMiddleware,
  errorHandler,
  notFoundHandler
} from './middleware';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Request processing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(express.raw({ type: 'application/octet-stream', limit: '15mb' }));

  // Trust proxy headers
  app.set('trust proxy', true);

  // Custom middleware
  app.use(requestIdMiddleware);
  app.use(requestLoggingMiddleware);

  // Routes
  app.use('/', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
