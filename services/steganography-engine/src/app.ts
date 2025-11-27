import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorMiddleware, loggingMiddleware, notFoundMiddleware } from './middleware';

export function createApp(): Application {
  const app = express();
  
  // Security middleware
  app.use(helmet());
  app.use(cors());
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Logging middleware
  app.use(loggingMiddleware);
  
  // API routes
  app.use('/', routes);
  
  // 404 handler
  app.use(notFoundMiddleware);
  
  // Error handler
  app.use(errorMiddleware);
  
  return app;
}

export default createApp;
