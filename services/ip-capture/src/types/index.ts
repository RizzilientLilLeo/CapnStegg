export interface CapturedIP {
  id: string;
  ipHash: string;
  rawIp?: string;
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
  geolocation?: GeoLocation;
}

export interface GeoLocation {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface LogEntry {
  id: string;
  ipHash: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
}

export interface SearchCriteria {
  startDate?: Date;
  endDate?: Date;
  ipHash?: string;
  limit?: number;
  offset?: number;
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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
