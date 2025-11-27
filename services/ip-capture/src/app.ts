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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom middleware
  app.use(requestIdMiddleware);
  app.use(requestLoggingMiddleware);

  // Trust proxy headers (for X-Forwarded-For)
  app.set('trust proxy', true);

  // Routes
  app.use('/', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
