import { Response } from 'express';
import { healthService, proxyService } from '../services';
import { RequestWithId } from '../middleware';
import config from '../config';
import logger from '../utils/logger';

export class OrchestrationController {
  /**
   * GET /health - Aggregate health check
   */
  async health(req: RequestWithId, res: Response): Promise<void> {
    try {
      const health = await healthService.checkAll();

      const statusCode = health.status === 'healthy' ? 200 : 
                         health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json({
        success: statusCode === 200,
        data: health,
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Health check failed', { error, requestId: req.requestId });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Failed to check service health'
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  /**
   * GET /metrics - Service metrics
   */
  metrics(req: RequestWithId, res: Response): void {
    // Basic metrics - in production, this would integrate with Prometheus
    res.json({
      success: true,
      data: {
        service: config.serviceName,
        version: config.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      metadata: this.getMetadata(req)
    });
  }

  /**
   * Proxy requests to steganography service
   */
  async proxySteganography(req: RequestWithId, res: Response): Promise<void> {
    try {
      const path = req.path.replace('/api/steganography', '');
      
      const result = await proxyService.proxyToSteganography({
        method: req.method,
        path: path || '/',
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
        query: req.query as Record<string, string>
      });

      // Handle image responses
      if (Buffer.isBuffer(result.data)) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
        res.status(result.status).send(result.data);
        return;
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error('Proxy to steganography failed', { error, requestId: req.requestId });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to proxy request to steganography service'
        },
        metadata: this.getMetadata(req)
      });
    }
  }

  /**
   * Proxy requests to IP capture service
   */
  async proxyIpCapture(req: RequestWithId, res: Response): Promise<void> {
    try {
      const path = req.path.replace('/api/ip-capture', '');
      
      const result = await proxyService.proxyToIpCapture({
        method: req.method,
        path: path || '/',
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
        query: req.query as Record<string, string>
      });

      res.status(result.status).json(result.data);
    } catch (error) {
      logger.error('Proxy to IP capture failed', { error, requestId: req.requestId });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Failed to proxy request to IP capture service'
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

export const orchestrationController = new OrchestrationController();
export default orchestrationController;
