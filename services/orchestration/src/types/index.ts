export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: string;
  details?: Record<string, unknown>;
}

export interface AggregatedHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    [serviceName: string]: ServiceHealth;
  };
}

export interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  timeout: number;
}

export interface ProxyRequest {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ProxyResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

export interface ServiceMetrics {
  service: string;
  requestsTotal: number;
  requestsSuccess: number;
  requestsError: number;
  averageResponseTime: number;
  lastUpdated: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata: ResponseMetadata;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  service: string;
}
