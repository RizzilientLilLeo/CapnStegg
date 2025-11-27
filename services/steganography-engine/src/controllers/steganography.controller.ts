import { Response } from 'express';
import { steganographyService } from '../services';
import { RequestWithId } from '../middleware';
import { ServiceResponse, SUPPORTED_FORMATS } from '../types';
import config from '../config';
import logger from '../utils/logger';

export class SteganographyController {
  /**
   * POST /encode - Encode a message into an image
   */
  async encode(req: RequestWithId, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { message, password } = req.body;

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Image file is required'
          },
          metadata: this.getMetadata(req)
        } as ServiceResponse<null>);
        return;
      }

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_MESSAGE',
            message: 'Message to encode is required'
          },
          metadata: this.getMetadata(req)
        } as ServiceResponse<null>);
        return;
      }

      const result = await steganographyService.encode(
        file.buffer,
        message,
        password
      );

      // Send the encoded image
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="encoded.png"',
        'X-Bytes-Used': result.bytesUsed.toString(),
        'X-Capacity': result.capacity.toString(),
        'X-Request-Id': req.requestId || ''
      });

      res.send(result.imageBuffer);
    } catch (error) {
      logger.error('Encode error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Encoding failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'ENCODE_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      } as ServiceResponse<null>);
    }
  }

  /**
   * POST /decode - Decode a message from an image
   */
  async decode(req: RequestWithId, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { password } = req.body;

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Image file is required'
          },
          metadata: this.getMetadata(req)
        } as ServiceResponse<null>);
        return;
      }

      const result = await steganographyService.decode(file.buffer, password);

      res.json({
        success: true,
        data: result,
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Decode error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Decoding failed';
      const statusCode = errorMessage.includes('Password required') ? 401 : 400;
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: 'DECODE_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      } as ServiceResponse<null>);
    }
  }

  /**
   * POST /capacity - Get the capacity of an image
   */
  async capacity(req: RequestWithId, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Image file is required'
          },
          metadata: this.getMetadata(req)
        } as ServiceResponse<null>);
        return;
      }

      const result = await steganographyService.getCapacity(file.buffer);

      res.json({
        success: true,
        data: result,
        metadata: this.getMetadata(req)
      });
    } catch (error) {
      logger.error('Capacity check error', { error, requestId: req.requestId });
      
      const errorMessage = error instanceof Error ? error.message : 'Capacity check failed';
      res.status(400).json({
        success: false,
        error: {
          code: 'CAPACITY_ERROR',
          message: errorMessage
        },
        metadata: this.getMetadata(req)
      } as ServiceResponse<null>);
    }
  }

  /**
   * GET /supported-formats - Get list of supported image formats
   */
  supportedFormats(req: RequestWithId, res: Response): void {
    res.json({
      success: true,
      data: {
        formats: SUPPORTED_FORMATS,
        maxFileSize: config.maxFileSize,
        encryptionSupported: true
      },
      metadata: this.getMetadata(req)
    });
  }

  /**
   * GET /health - Health check endpoint
   */
  health(req: RequestWithId, res: Response): void {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: config.serviceName,
        version: config.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      metadata: this.getMetadata(req)
    });
  }

  private getMetadata(req: RequestWithId) {
    return {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      service: config.serviceName
    };
  }
}

export const steganographyController = new SteganographyController();
export default steganographyController;
