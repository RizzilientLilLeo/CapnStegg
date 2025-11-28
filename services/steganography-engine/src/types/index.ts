export interface EncodedResult {
  image: Buffer;
  format: string;
  bytesUsed: number;
  capacity: number;
}

export interface DecodedResult {
  message: string;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  length: number;
  encrypted: boolean;
  timestamp?: string;
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

export interface CapacityInfo {
  totalBytes: number;
  availableBytes: number;
  maxMessageLength: number;
}

export interface CompositeResult {
  image: Buffer;
  format: string;
  width: number;
  height: number;
  imagesUsed: number;
}
