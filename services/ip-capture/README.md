# IP Capture Service

## Overview

The IP Capture Service is responsible for capturing, logging, and analyzing incoming IP addresses from HTTP requests while maintaining anonymity through proxy chains.

## Features

- **IP Capture**: Capture source IP addresses from requests
- **Logging**: Structured logging of capture events
- **Anonymization**: Hash and anonymize IP addresses for privacy
- **Geolocation**: Optional GeoIP lookup for location data
- **Rate Limiting**: Protect against abuse

## API Endpoints

| Method | Endpoint      | Description                        |
|--------|---------------|------------------------------------|
| GET    | `/capture`    | Capture requester's IP address     |
| GET    | `/logs`       | Retrieve captured IP logs          |
| DELETE | `/logs/:id`   | Delete specific log entry          |
| GET    | `/health`     | Service health check               |

## Getting Started

### Prerequisites

- Node.js v18 LTS or higher
- npm or yarn

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

| Variable              | Default       | Description                    |
|-----------------------|---------------|--------------------------------|
| `PORT`                | `3002`        | Service port                   |
| `NODE_ENV`            | `development` | Environment                    |
| `LOG_LEVEL`           | `info`        | Logging level                  |
| `ENABLE_GEOLOCATION`  | `false`       | Enable GeoIP lookup            |
| `ANONYMIZE_IPS`       | `true`        | Hash IP addresses in logs      |

## Directory Structure

```
ip-capture/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express application
│   ├── config/               # Configuration
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── routes/               # API routes
│   ├── middleware/           # Express middleware
│   └── repositories/         # Data access layer
├── tests/                    # Test files
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Data Captured

- Source IP address (hashed by default)
- Timestamp (UTC)
- User-Agent header
- Referrer (if available)
- Geolocation (optional)

## Privacy Considerations

- IP addresses are hashed by default using SHA-256
- Full IP addresses are never stored in plain text
- Log rotation and secure deletion policies apply
- Compliant with privacy regulations

## Status

✅ **Production Ready**: Fully implemented with unit tests

### Features Implemented
- IP address capture from HTTP requests
- SHA-256 hashing for IP anonymization
- SQLite database for log storage
- X-Forwarded-For and X-Real-IP header support
- Statistics and analytics endpoints
- RESTful API with Express.js
- Winston structured logging
- Comprehensive unit tests (32 tests)

---

*See the main [README](../../README.md) for project overview.*
