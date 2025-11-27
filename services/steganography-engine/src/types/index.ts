export interface EncodeRequest {
  message: string;
  password?: string;
}

export interface EncodeResult {
  success: boolean;
  imageBuffer?: Buffer;
  format: string;
  bytesUsed: number;
  capacity: number;
}

export interface DecodeResult {
  success: boolean;
  message: string;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  length: number;
  encrypted: boolean;
  timestamp: string;
}

export interface CapacityResult {
  totalCapacity: number;
  availableBytes: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
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

export type SupportedFormat = 'png' | 'bmp' | 'tiff';

export const SUPPORTED_FORMATS: SupportedFormat[] = ['png', 'bmp', 'tiff'];
export const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/bmp',
  'image/tiff',
  'image/x-ms-bmp'
];
