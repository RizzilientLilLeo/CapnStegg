import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { services } from '../config';
import logger from '../utils/logger';

export interface ProxyOptions {
  method: string;
  path: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string>;
}

export interface ProxyResult {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

export class ProxyService {
  /**
   * Proxy request to steganography service
   */
  async proxyToSteganography(options: ProxyOptions): Promise<ProxyResult> {
    return this.proxyRequest(services.steganography.url, options);
  }

  /**
   * Proxy request to IP capture service
   */
  async proxyToIpCapture(options: ProxyOptions): Promise<ProxyResult> {
    return this.proxyRequest(services.ipCapture.url, options);
  }

  /**
   * Generic proxy request handler
   */
  private async proxyRequest(baseUrl: string, options: ProxyOptions): Promise<ProxyResult> {
    const url = `${baseUrl}${options.path}`;
    
    const config: AxiosRequestConfig = {
      method: options.method as any,
      url,
      headers: this.sanitizeHeaders(options.headers || {}),
      data: options.body,
      params: options.query,
      timeout: 30000,
      // Allow binary responses
      responseType: 'arraybuffer',
      validateStatus: () => true // Don't throw on non-2xx
    };

    logger.debug('Proxying request', {
      method: options.method,
      url,
      hasBody: !!options.body
    });

    try {
      const response = await axios(config);
      
      // Determine if response is JSON or binary
      const contentType = response.headers['content-type'] || '';
      let data: unknown;
      
      if (contentType.includes('application/json')) {
        data = JSON.parse(response.data.toString());
      } else if (contentType.includes('image/')) {
        data = response.data; // Keep as buffer for images
      } else {
        try {
          data = JSON.parse(response.data.toString());
        } catch {
          data = response.data.toString();
        }
      }

      return {
        status: response.status,
        data,
        headers: this.extractHeaders(response.headers)
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      logger.error('Proxy request failed', {
        url,
        error: axiosError.message,
        code: axiosError.code
      });

      if (axiosError.code === 'ECONNREFUSED') {
        return {
          status: 503,
          data: {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Backend service is not available'
            }
          },
          headers: {}
        };
      }

      throw error;
    }
  }

  /**
   * Sanitize headers for proxying
   */
  private sanitizeHeaders(
    headers: Record<string, string | string[] | undefined>
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    // Headers to skip
    const skipHeaders = [
      'host',
      'connection',
      'content-length',
      'transfer-encoding'
    ];
    
    for (const [key, value] of Object.entries(headers)) {
      if (skipHeaders.includes(key.toLowerCase())) continue;
      if (value === undefined) continue;
      
      sanitized[key] = Array.isArray(value) ? value[0] : value;
    }
    
    return sanitized;
  }

  /**
   * Extract headers from axios response
   */
  private extractHeaders(headers: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    
    return result;
  }
}

export const proxyService = new ProxyService();
export default proxyService;
