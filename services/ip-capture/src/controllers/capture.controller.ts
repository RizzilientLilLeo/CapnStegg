import { Response } from 'express';
import { captureService } from '../services';
import { getLogRepository } from '../repositories';
import { RequestWithId } from '../middleware';
import config from '../config';
import logger from '../utils/logger';

export class CaptureController {
  /**
   * GET /capture - Capture requester's IP address
   */
  capture(req: RequestWithId, res: Response): void {
    try {
      const captured = captureService.capture(req);

      res.json({
        success: true,
        data: {
          id: captured.id,
          ipHash: captured.ipHash,
          timestamp: captured.timestamp.toISOString(),
          anonymized: config.anonymizeIPs
        },
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Capture error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Capture failed';
      res.status(500).json({
        success: false,
        error: {
          code: 'CAPTURE_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  /**
   * GET /logs - Retrieve captured IP logs
   */
  getLogs(req: RequestWithId, res: Response): void {
    try {
      const { limit, offset, startDate, endDate, ipHash } = req.query;

      const criteria = {
        limit: limit ? parseInt(limit as string, 10) : 100,
        offset: offset ? parseInt(offset as string, 10) : 0,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        ipHash: ipHash as string | undefined
      };

      const logs = captureService.getLogs(criteria);

      res.json({
        success: true,
        data: {
          logs,
          count: logs.length,
          ...criteria
        },
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Get logs error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve logs';
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGS_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  /**
   * GET /logs/:id - Get a specific log entry
   */
  getLog(req: RequestWithId, res: Response): void {
    try {
      const { id } = req.params;
      const log = captureService.getLog(id);

      if (!log) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Log entry ${id} not found`
          },
          metadata: this.getMetadata(req)
        });
        return;
      }

      res.json({
        success: true,
        data: log,
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Get log error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve log';
      res.status(500).json({
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  /**
   * DELETE /logs/:id - Delete a specific log entry
   */
  deleteLog(req: RequestWithId, res: Response): void {
    try {
      const { id } = req.params;
      const deleted = captureService.deleteLog(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Log entry ${id} not found`
          },
          metadata: this.getMetadata(req)
        });
        return;
      }

      res.json({
        success: true,
        data: {
          deleted: true,
          id
        },
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Delete log error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete log';
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  /**
   * GET /stats - Get capture statistics
   */
  getStats(req: RequestWithId, res: Response): void {
    try {
      const stats = captureService.getStats();

      res.json({
        success: true,
        data: stats,
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Get stats error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve stats';
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  /**
   * GET /health - Health check endpoint
   */
  health(req: RequestWithId, res: Response): void {
    try {
      const repository = getLogRepository();
      const recordCount = repository.getRecordCount();

      res.json({
        success: true,
        data: {
          status: 'healthy',
          service: config.serviceName,
          version: config.version,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          database: {
            connected: true,
            records: recordCount
          }
        },
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          service: config.serviceName,
          version: config.version,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          database: {
            connected: false,
            records: 0
          }
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  private getMetadata(req: RequestWithId) {
    return {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      service: config.serviceName
    };
  }
}

export const captureController = new CaptureController();
export default captureController;
