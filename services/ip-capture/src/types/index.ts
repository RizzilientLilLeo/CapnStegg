export interface CapturedIP {
  id: string;
  ipHash: string;
  rawIp?: string; // Only stored if anonymization is disabled
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
  geolocation?: GeoLocation;
  metadata?: Record<string, unknown>;
}

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface LogEntry {
  id: string;
  ipHash: string;
  timestamp: string;
  userAgent: string | null;
  referrer: string | null;
  metadata: string | null;
}

export interface SearchCriteria {
  startDate?: Date;
  endDate?: Date;
  ipHash?: string;
  limit?: number;
  offset?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  database: {
    connected: boolean;
    records: number;
  };
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

export interface CaptureStats {
  totalCaptures: number;
  uniqueIPs: number;
  capturesLast24h: number;
  capturesLastWeek: number;
}
