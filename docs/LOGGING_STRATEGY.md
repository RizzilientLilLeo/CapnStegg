# Logging Strategy Document

## CapnStegg - Centralized Logging Architecture

---

## 1. Overview

This document outlines the logging strategy for the CapnStegg microservices architecture. A well-defined logging strategy ensures effective debugging, monitoring, security auditing, and compliance across all services.

---

## 2. Logging Objectives

1. **Observability**: Enable real-time monitoring of system health and performance
2. **Debugging**: Facilitate quick identification and resolution of issues
3. **Security Auditing**: Track access patterns and detect anomalies
4. **Compliance**: Maintain audit trails for regulatory requirements
5. **Performance Analysis**: Identify bottlenecks and optimization opportunities

---

## 3. Log Levels

The project follows standard log levels as defined by RFC 5424:

| Level   | Code | Description                                      | Use Case                              |
|---------|------|--------------------------------------------------|---------------------------------------|
| ERROR   | 3    | Error conditions                                 | Service failures, exceptions          |
| WARN    | 4    | Warning conditions                               | Deprecations, recoverable issues      |
| INFO    | 6    | Informational messages                           | Normal operations, request logs       |
| DEBUG   | 7    | Debug-level messages                             | Development debugging                 |
| TRACE   | 8    | Detailed trace messages                          | Fine-grained debugging                |

### Production Log Levels

| Environment | Minimum Level | Rationale                              |
|-------------|---------------|----------------------------------------|
| Production  | INFO          | Balance between visibility and volume  |
| Staging     | DEBUG         | Additional context for testing         |
| Development | TRACE         | Full visibility for debugging          |

---

## 4. Log Format

### 4.1 Structured Logging (JSON)

All services must use structured JSON logging for machine parseability:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "steganography-engine",
  "traceId": "abc123-def456-ghi789",
  "spanId": "span-001",
  "message": "Image encoding completed successfully",
  "metadata": {
    "imageSize": 1048576,
    "encodingTime": 1250,
    "format": "PNG"
  }
}
```

### 4.2 Required Fields

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| timestamp   | ISO 8601 | UTC timestamp of the log event           |
| level       | string   | Log level (ERROR, WARN, INFO, DEBUG)     |
| service     | string   | Name of the originating service          |
| traceId     | string   | Distributed tracing correlation ID       |
| message     | string   | Human-readable log message               |

### 4.3 Optional Fields

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| spanId      | string   | Span identifier for distributed tracing  |
| userId      | string   | Anonymized user identifier               |
| requestId   | string   | Unique request identifier                |
| metadata    | object   | Additional context-specific data         |
| error       | object   | Error details (stack trace, code)        |

---

## 5. Service-Specific Logging

### 5.1 Steganography Engine

**What to Log:**
- Image upload/download events
- Encoding/decoding operations (success/failure)
- Capacity calculations
- Format validation results

**Sample Log Entry:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "steganography-engine",
  "traceId": "abc123",
  "message": "Encoding operation completed",
  "metadata": {
    "operation": "encode",
    "inputFormat": "PNG",
    "inputSize": 2048576,
    "payloadSize": 1024,
    "duration": 1500
  }
}
```

### 5.2 IP Capture Service

**What to Log:**
- IP capture events (anonymized if required)
- Rate limiting triggers
- Geolocation lookups
- Log retrieval operations

**Privacy Considerations:**
- Hash or truncate IP addresses based on privacy settings
- Never log full IPs in DEBUG mode without explicit configuration

**Sample Log Entry:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "ip-capture",
  "traceId": "def456",
  "message": "IP address captured",
  "metadata": {
    "ipHash": "a1b2c3d4...",
    "userAgentHash": "e5f6g7h8...",
    "country": "US",
    "timestamp": 1705314645123
  }
}
```

### 5.3 Orchestration Service

**What to Log:**
- Incoming request routing
- Service health status changes
- Load balancing decisions
- Authentication/authorization events

**Sample Log Entry:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "orchestration",
  "traceId": "ghi789",
  "message": "Request routed to backend service",
  "metadata": {
    "targetService": "steganography-engine",
    "endpoint": "/encode",
    "method": "POST",
    "responseTime": 1250,
    "statusCode": 200
  }
}
```

---

## 6. Log Aggregation Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Steganography  │    │   IP Capture    │    │  Orchestration  │
│     Engine      │    │    Service      │    │    Service      │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Log Collector       │
                    │   (Fluentd/Filebeat)  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Log Storage         │
                    │   (Elasticsearch)     │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Visualization       │
                    │   (Kibana/Grafana)    │
                    └───────────────────────┘
```

---

## 7. Recommended Libraries

### Node.js/TypeScript

| Library   | Purpose                              | Notes                          |
|-----------|--------------------------------------|--------------------------------|
| Winston   | Primary logging library              | Highly configurable            |
| Pino      | High-performance alternative         | 5x faster than Winston         |
| Morgan    | HTTP request logging (Express)       | Middleware for access logs     |

### Configuration Example (Winston)

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'service-name' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

export default logger;
```

---

## 8. Log Retention Policy

| Log Type          | Retention Period | Storage Location          |
|-------------------|------------------|---------------------------|
| Application Logs  | 30 days          | Local filesystem + remote |
| Error Logs        | 90 days          | Remote storage            |
| Security Logs     | 1 year           | Secure archive            |
| Access Logs       | 30 days          | Nginx logs directory      |

---

## 9. Security Logging Requirements

### 9.1 Sensitive Data Handling

**NEVER log:**
- Passwords or authentication tokens
- Encryption keys or secrets
- Full credit card numbers
- Personal Identifiable Information (PII) without anonymization

**ALWAYS log:**
- Authentication attempts (success/failure)
- Authorization decisions
- Security-relevant configuration changes
- Rate limiting and blocking events

### 9.2 Log Integrity

- Implement log signing for tamper detection
- Use append-only storage where possible
- Regular backup of security-critical logs

---

## 10. Monitoring and Alerting

### Alert Thresholds

| Metric                        | Warning Threshold | Critical Threshold |
|-------------------------------|-------------------|--------------------|
| Error rate (per minute)       | > 10              | > 50               |
| Response time (p95)           | > 500ms           | > 2000ms           |
| Service health check failures | 1                 | 3 consecutive      |
| Log volume anomaly            | +50%              | +200%              |

---

## 11. Implementation Checklist

- [ ] Configure Winston/Pino in each service
- [ ] Implement correlation ID middleware
- [ ] Set up log rotation
- [ ] Configure log shipping to central storage
- [ ] Create Kibana/Grafana dashboards
- [ ] Define and configure alerts
- [ ] Document service-specific logging conventions
- [ ] Implement log sanitization for sensitive data

---

*Document Version: 1.0.0*
*Last Updated: Phase 1 Initial Release*
