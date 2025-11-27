import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findLogs, findLogById, deleteLog, getStats } from '../repositories/log.repository';
import { ServiceResponse, LogEntry, PaginatedResult, SearchCriteria } from '../types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Get all logs with pagination
 */
export async function getLogsController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  
  try {
    const limit = Math.min(
      parseInt(req.query.limit as string, 10) || 50,
      config.maxLogsPerRequest
    );
    const offset = parseInt(req.query.offset as string, 10) || 0;
    
    const criteria: SearchCriteria = {
      limit,
      offset
    };
    
    // Optional filters
    if (req.query.startDate) {
      criteria.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      criteria.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.ipHash) {
      criteria.ipHash = req.query.ipHash as string;
    }
    
    const result = findLogs(criteria);
    
    logger.info('Logs retrieved', {
      requestId,
      count: result.items.length,
      total: result.total
    });
    
    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<PaginatedResult<LogEntry>>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Get logs failed', { requestId, error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LOGS_FAILED',
        message: errorMessage
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<never>);
  }
}

/**
 * Get a specific log by ID
 */
export async function getLogByIdController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  const { id } = req.params;
  
  try {
    const log = findLogById(id);
    
    if (!log) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: `Log entry with ID ${id} not found`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    res.json({
      success: true,
      data: log,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<LogEntry>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Get log by ID failed', { requestId, id, error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LOG_FAILED',
        message: errorMessage
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<never>);
  }
}

/**
 * Delete a log entry by ID
 */
export async function deleteLogController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  const { id } = req.params;
  
  try {
    const deleted = deleteLog(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: `Log entry with ID ${id} not found`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          service: config.serviceName
        }
      } as ServiceResponse<never>);
      return;
    }
    
    logger.info('Log deleted', { requestId, id });
    
    res.json({
      success: true,
      data: { deleted: true, id },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<{ deleted: boolean; id: string }>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Delete log failed', { requestId, id, error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_LOG_FAILED',
        message: errorMessage
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<never>);
  }
}

/**
 * Get database statistics
 */
export async function getStatsController(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  
  try {
    const stats = getStats();
    
    res.json({
      success: true,
      data: stats,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<{ totalLogs: number; oldestLog: string | null; newestLog: string | null }>);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Get stats failed', { requestId, error: errorMessage });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATS_FAILED',
        message: errorMessage
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        service: config.serviceName
      }
    } as ServiceResponse<never>);
  }
}
