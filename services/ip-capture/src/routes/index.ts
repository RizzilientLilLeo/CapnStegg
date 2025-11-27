import { Router } from 'express';
import { captureController } from '../controllers/capture.controller';
import { 
  getLogsController, 
  getLogByIdController, 
  deleteLogController,
  getStatsController
} from '../controllers/logs.controller';
import config from '../config';

const router = Router();

// Capture endpoint
router.get('/capture', captureController);

// Logs endpoints
router.get('/logs', getLogsController);
router.get('/logs/stats', getStatsController);
router.get('/logs/:id', getLogByIdController);
router.delete('/logs/:id', deleteLogController);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      anonymization: config.anonymizeIps,
      geolocation: config.enableGeolocation
    }
  });
});

export default router;
