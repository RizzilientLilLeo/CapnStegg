# Orchestration Service

## Overview

The Orchestration Service is the central coordinator for all service requests, handling routing, load balancing, request validation, and inter-service communication.

## Features

- **Request Routing**: Route requests to appropriate backend services
- **Load Balancing**: Distribute load across service instances
- **Health Monitoring**: Aggregate health status from all services
- **Rate Limiting**: Protect services from abuse
- **Circuit Breaker**: Handle service failures gracefully
- **Metrics Collection**: Collect and expose service metrics

## API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/steganography/*`| Proxy to Steganography Engine  |
| GET    | `/api/ip-capture/*`   | Proxy to IP Capture Service    |
| GET    | `/health`             | Aggregate health status        |
| GET    | `/metrics`            | Service metrics                |

## Getting Started

### Prerequisites

- Node.js v18 LTS or higher
- npm or yarn
- Redis (for caching and rate limiting)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

### Running Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## Configuration

Environment variables:

| Variable                    | Default       | Description                    |
|-----------------------------|---------------|--------------------------------|
| `PORT`                      | `3000`        | Service port                   |
| `NODE_ENV`                  | `development` | Environment                    |
| `LOG_LEVEL`                 | `info`        | Logging level                  |
| `STEGANOGRAPHY_SERVICE_URL` | `http://localhost:3001` | Steganography Engine URL |
| `IP_CAPTURE_SERVICE_URL`    | `http://localhost:3002` | IP Capture Service URL  |
| `REDIS_URL`                 | `redis://localhost:6379` | Redis connection URL   |
| `RATE_LIMIT_MAX`            | `100`         | Max requests per window        |
| `RATE_LIMIT_WINDOW`         | `60`          | Rate limit window (seconds)    |

## Directory Structure

```
orchestration/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express application
│   ├── config/               # Configuration
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   │   ├── router.service.ts # Request routing
│   │   ├── health.service.ts # Health aggregation
│   │   └── proxy.service.ts  # Service proxying
│   ├── routes/               # API routes
│   └── middleware/           # Express middleware
│       ├── rate-limit.middleware.ts
│       └── circuit-breaker.middleware.ts
├── tests/                    # Test files
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Architecture

```
                    ┌─────────────────────┐
                    │   Nginx Reverse     │
                    │       Proxy         │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Orchestration     │
                    │      Service        │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Steganography  │  │   IP Capture    │  │     Redis       │
│     Engine      │  │    Service      │  │    (Cache)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Health Checks

The orchestration service aggregates health status from all backend services:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "services": {
    "steganography-engine": {
      "status": "healthy",
      "responseTime": 45
    },
    "ip-capture": {
      "status": "healthy",
      "responseTime": 32
    }
  }
}
```

## Status

🚧 **Phase 1**: Scaffolding and documentation complete

---

*See the main [README](../../README.md) for project overview.*
