# Modular Code Plan

## CapnStegg - Microservices Architecture Guide

---

## 1. Introduction

This document defines the modular code structure for the CapnStegg project. Each service is designed as an independent, loosely coupled module that can be developed, tested, and deployed independently.

---

## 2. Project Structure Overview

```
CapnStegg/
├── docs/                          # Project documentation
│   ├── TECHNICAL_SPECIFICATION.md
│   ├── LOGGING_STRATEGY.md
│   ├── MODULAR_CODE_PLAN.md
│   └── INFRASTRUCTURE.md
│
├── services/                      # Microservices directory
│   ├── steganography-engine/      # Steganography service
│   ├── ip-capture/                # IP capture service
│   └── orchestration/             # Orchestration service
│
├── shared/                        # Shared libraries and utilities
│   ├── logger/                    # Common logging module
│   ├── config/                    # Shared configuration
│   └── types/                     # Shared TypeScript types
│
├── infrastructure/                # Infrastructure configurations
│   ├── docker/                    # Docker configurations
│   ├── nginx/                     # Nginx configurations
│   └── proxychains/               # ProxyChains configurations
│
├── scripts/                       # Utility scripts
│   ├── setup.sh                   # Development setup
│   ├── deploy.sh                  # Deployment script
│   └── test-all.sh                # Run all tests
│
├── docker-compose.yml             # Multi-service orchestration
├── docker-compose.dev.yml         # Development overrides
├── README.md                      # Project README
├── CONTRIBUTING.md                # Contribution guidelines
├── LICENSE                        # Project license
└── .gitignore                     # Git ignore rules
```

---

## 3. Service Module Structure

Each service follows a consistent internal structure:

```
service-name/
├── src/
│   ├── index.ts                  # Application entry point
│   ├── app.ts                    # Express application setup
│   ├── config/                   # Service configuration
│   │   ├── index.ts              # Configuration exports
│   │   └── environment.ts        # Environment variables
│   │
│   ├── controllers/              # Request handlers
│   │   ├── index.ts              # Controller exports
│   │   └── feature.controller.ts # Feature-specific controller
│   │
│   ├── services/                 # Business logic
│   │   ├── index.ts              # Service exports
│   │   └── feature.service.ts    # Feature-specific service
│   │
│   ├── routes/                   # API route definitions
│   │   ├── index.ts              # Route aggregation
│   │   └── feature.routes.ts     # Feature-specific routes
│   │
│   ├── middleware/               # Express middleware
│   │   ├── index.ts              # Middleware exports
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── auth.middleware.ts    # Authentication
│   │   └── logging.middleware.ts # Request logging
│   │
│   ├── models/                   # Data models
│   │   ├── index.ts              # Model exports
│   │   └── feature.model.ts      # Feature-specific model
│   │
│   ├── utils/                    # Utility functions
│   │   ├── index.ts              # Utility exports
│   │   └── helpers.ts            # Helper functions
│   │
│   └── types/                    # TypeScript types
│       ├── index.ts              # Type exports
│       └── feature.types.ts      # Feature-specific types
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── fixtures/                 # Test fixtures
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest configuration
├── Dockerfile                    # Container definition
├── .env.example                  # Environment template
└── README.md                     # Service documentation
```

---

## 4. Module Design Principles

### 4.1 Single Responsibility Principle

Each module should have one reason to change:

```typescript
// GOOD: Single responsibility
class ImageEncoder {
  encode(image: Buffer, message: string): Buffer {
    // Only handles encoding
  }
}

class ImageDecoder {
  decode(image: Buffer): string {
    // Only handles decoding
  }
}

// BAD: Multiple responsibilities
class ImageProcessor {
  encode(image: Buffer, message: string): Buffer { }
  decode(image: Buffer): string { }
  resize(image: Buffer, width: number, height: number): Buffer { }
  uploadToCloud(image: Buffer): Promise<string> { }
}
```

### 4.2 Dependency Injection

Services should receive dependencies through constructors:

```typescript
// service/steganography.service.ts
export class SteganographyService {
  constructor(
    private readonly encoder: IEncoder,
    private readonly validator: IValidator,
    private readonly logger: ILogger
  ) {}

  async encode(image: Buffer, message: string): Promise<Buffer> {
    this.logger.info('Starting encoding process');
    await this.validator.validate(image);
    return this.encoder.encode(image, message);
  }
}
```

### 4.3 Interface Segregation

Define focused interfaces:

```typescript
// types/interfaces.ts

// GOOD: Focused interfaces
interface IEncoder {
  encode(image: Buffer, message: string): Buffer;
}

interface IDecoder {
  decode(image: Buffer): string;
}

interface ICapacityCalculator {
  calculateCapacity(image: Buffer): number;
}

// BAD: Fat interface
interface ISteganography {
  encode(image: Buffer, message: string): Buffer;
  decode(image: Buffer): string;
  calculateCapacity(image: Buffer): number;
  validateImage(image: Buffer): boolean;
  compressImage(image: Buffer): Buffer;
}
```

---

## 5. Steganography Engine Module Plan

### 5.1 Core Components

```
steganography-engine/src/
├── services/
│   ├── encoder.service.ts        # LSB encoding logic
│   ├── decoder.service.ts        # LSB decoding logic
│   ├── encryption.service.ts     # AES-256 encryption
│   └── validation.service.ts     # Image validation
│
├── controllers/
│   ├── encode.controller.ts      # /encode endpoint
│   └── decode.controller.ts      # /decode endpoint
│
└── utils/
    ├── image.utils.ts            # Image manipulation
    └── bit.utils.ts              # Bit manipulation
```

### 5.2 Key Interfaces

```typescript
interface IEncoderService {
  encode(image: Buffer, message: string, password?: string): Promise<EncodedResult>;
  getCapacity(image: Buffer): number;
}

interface IDecoderService {
  decode(image: Buffer, password?: string): Promise<DecodedResult>;
  hasHiddenData(image: Buffer): boolean;
}

interface EncodedResult {
  image: Buffer;
  format: ImageFormat;
  bytesUsed: number;
  capacity: number;
}

interface DecodedResult {
  message: string;
  metadata: MessageMetadata;
}
```

---

## 6. IP Capture Module Plan

### 6.1 Core Components

```
ip-capture/src/
├── services/
│   ├── capture.service.ts        # IP capture logic
│   ├── storage.service.ts        # Log storage
│   ├── geolocation.service.ts    # GeoIP lookup
│   └── anonymization.service.ts  # IP anonymization
│
├── controllers/
│   ├── capture.controller.ts     # /capture endpoint
│   └── logs.controller.ts        # /logs endpoints
│
└── repositories/
    └── log.repository.ts         # Database operations
```

### 6.2 Key Interfaces

```typescript
interface ICaptureService {
  capture(request: IncomingRequest): Promise<CapturedIP>;
  getRequestInfo(request: IncomingRequest): RequestInfo;
}

interface IStorageService {
  save(entry: LogEntry): Promise<string>;
  find(criteria: SearchCriteria): Promise<LogEntry[]>;
  delete(id: string): Promise<boolean>;
}

interface CapturedIP {
  id: string;
  ipHash: string;
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
  geolocation?: GeoLocation;
}
```

---

## 7. Orchestration Module Plan

### 7.1 Core Components

```
orchestration/src/
├── services/
│   ├── router.service.ts         # Request routing
│   ├── health.service.ts         # Health aggregation
│   ├── metrics.service.ts        # Metrics collection
│   └── proxy.service.ts          # Service proxying
│
├── controllers/
│   ├── api.controller.ts         # API proxy endpoints
│   └── health.controller.ts      # Health endpoints
│
└── middleware/
    ├── rate-limit.middleware.ts  # Rate limiting
    └── circuit-breaker.middleware.ts # Circuit breaker
```

### 7.2 Key Interfaces

```typescript
interface IRouterService {
  route(request: ProxyRequest): Promise<ProxyResponse>;
  getServiceUrl(serviceName: string): string;
}

interface IHealthService {
  checkAll(): Promise<HealthStatus[]>;
  checkService(serviceName: string): Promise<HealthStatus>;
}

interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  timeout: number;
}
```

---

## 8. Shared Modules

### 8.1 Logger Module

```typescript
// shared/logger/index.ts
export interface ILogger {
  error(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  info(message: string, meta?: object): void;
  debug(message: string, meta?: object): void;
}

export function createLogger(serviceName: string): ILogger {
  // Winston/Pino configuration
}
```

### 8.2 Configuration Module

```typescript
// shared/config/index.ts
export interface IConfig {
  get<T>(key: string): T;
  getOrDefault<T>(key: string, defaultValue: T): T;
}

export function loadConfig(): IConfig {
  // Load from environment and config files
}
```

### 8.3 Shared Types

```typescript
// shared/types/index.ts
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
```

---

## 9. Testing Strategy

### 9.1 Test Structure

```
tests/
├── unit/                         # Fast, isolated tests
│   ├── services/                 # Service unit tests
│   └── utils/                    # Utility unit tests
│
├── integration/                  # Service integration
│   ├── api/                      # API endpoint tests
│   └── database/                 # Database tests
│
└── e2e/                          # End-to-end tests
    └── flows/                    # Complete user flows
```

### 9.2 Test Coverage Requirements

| Type        | Coverage Target | Scope                              |
|-------------|-----------------|-------------------------------------|
| Unit        | 80%             | Individual functions/methods        |
| Integration | 70%             | Service interactions                |
| E2E         | Critical paths  | Key user workflows                  |

---

## 10. Module Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                    Orchestration                         │
│                                                         │
│   ┌───────────────────┐     ┌───────────────────┐      │
│   │  Steganography    │     │    IP Capture     │      │
│   │     Engine        │     │    Service        │      │
│   └─────────┬─────────┘     └─────────┬─────────┘      │
└─────────────┼─────────────────────────┼────────────────┘
              │                         │
              └───────────┬─────────────┘
                          │
              ┌───────────┴───────────┐
              │   Shared Libraries    │
              │   - Logger            │
              │   - Config            │
              │   - Types             │
              └───────────────────────┘
```

---

## 11. Implementation Checklist

### Phase 1 - Foundation
- [ ] Set up TypeScript configuration
- [ ] Create shared logger module
- [ ] Create shared config module
- [ ] Define shared interfaces

### Phase 2 - Steganography Engine
- [ ] Implement encoder service
- [ ] Implement decoder service
- [ ] Add encryption layer
- [ ] Create API endpoints
- [ ] Write unit tests

### Phase 3 - IP Capture Service
- [ ] Implement capture service
- [ ] Add storage layer
- [ ] Integrate geolocation
- [ ] Create API endpoints
- [ ] Write unit tests

### Phase 4 - Orchestration
- [ ] Implement router service
- [ ] Add health checks
- [ ] Configure rate limiting
- [ ] Set up circuit breaker
- [ ] Write integration tests

---

*Document Version: 1.0.0*
*Last Updated: Phase 1 Initial Release*
