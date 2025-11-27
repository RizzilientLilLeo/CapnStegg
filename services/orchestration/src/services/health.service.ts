import axios, { AxiosError } from 'axios';
import { services } from '../config';
import logger from '../utils/logger';
import { ServiceHealth, AggregatedHealth, ServiceConfig } from '../types';
import config from '../config';

export class HealthService {
  private serviceConfigs: ServiceConfig[];

  constructor() {
    this.serviceConfigs = [services.steganography, services.ipCapture];
  }

  /**
   * Check health of a single service
   */
  async checkService(serviceConfig: ServiceConfig): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(
        `${serviceConfig.url}${serviceConfig.healthEndpoint}`,
        { timeout: serviceConfig.timeout }
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: response.data
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const axiosError = error as AxiosError;
      
      logger.warn(`Health check failed for ${serviceConfig.name}`, {
        error: axiosError.message,
        url: serviceConfig.url
      });
      
      return {
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          error: axiosError.message,
          code: axiosError.code
        }
      };
    }
  }

  /**
   * Check health of all services
   */
  async checkAll(): Promise<AggregatedHealth> {
    const healthResults: { [key: string]: ServiceHealth } = {};
    
    await Promise.all(
      this.serviceConfigs.map(async (serviceConfig) => {
        healthResults[serviceConfig.name] = await this.checkService(serviceConfig);
      })
    );
    
    // Determine overall status
    const statuses = Object.values(healthResults).map(h => h.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    
    if (statuses.every(s => s === 'healthy')) {
      overallStatus = 'healthy';
    } else if (statuses.some(s => s === 'healthy')) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
    
    return {
      status: overallStatus,
      service: config.serviceName,
      version: config.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: healthResults
    };
  }

  /**
   * Get the service configuration list
   */
  getServiceConfigs(): ServiceConfig[] {
    return this.serviceConfigs;
  }
}

export const healthService = new HealthService();
export default healthService;
