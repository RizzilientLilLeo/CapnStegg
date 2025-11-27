# Technical Specification Document

## CapnStegg - Steganography and IP Capture Tool

### Version: 1.0.0 (Phase 1)

---

## 1. Executive Summary

CapnStegg is a modular steganography and IP capture tool designed for secure, privacy-focused operations. The project implements a microservices architecture consisting of three core services: Steganography Engine, IP Capture Service, and Orchestration Service.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                          │
│                  (Debian Server Gateway)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Orchestration Service                         │
│              (Request Routing & Coordination)                   │
└─────────────────────────────────────────────────────────────────┘
                    │                   │
        ┌───────────┴───────────┐       │
        ▼                       ▼       ▼
┌───────────────────┐   ┌───────────────────┐
│  Steganography    │   │   IP Capture      │
│     Engine        │   │    Service        │
│                   │   │                   │
│  - Encode data    │   │  - Capture IPs    │
│  - Decode data    │   │  - Log requests   │
│  - Image support  │   │  - Anonymization  │
└───────────────────┘   └───────────────────┘
```

### 2.2 Microservices Overview

| Service                | Port  | Description                                      |
|------------------------|-------|--------------------------------------------------|
| Steganography Engine   | 3001  | Handles encoding/decoding of hidden data         |
| IP Capture Service     | 3002  | Captures and logs incoming IP addresses          |
| Orchestration Service  | 3000  | Coordinates requests between services            |

---

## 3. Technology Stack

### 3.1 Backend Services

- **Runtime**: Node.js (v18 LTS or higher)
- **Framework**: Express.js for REST APIs
- **Language**: TypeScript for type safety
- **Database**: SQLite for development, PostgreSQL for production
- **Message Queue**: Redis (for inter-service communication)

### 3.2 Infrastructure

- **Operating System**: Debian 12 (Bookworm)
- **Web Server/Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose
- **Anonymity Layer**: ProxyChains-ng

### 3.3 Development Tools

- **Version Control**: Git
- **Package Manager**: npm or yarn
- **Testing**: Jest
- **Linting**: ESLint with Prettier
- **Documentation**: Markdown

---

## 4. Service Specifications

### 4.1 Steganography Engine

#### Purpose
Encode and decode hidden messages within image files using LSB (Least Significant Bit) steganography.

#### API Endpoints

| Method | Endpoint         | Description                          |
|--------|------------------|--------------------------------------|
| POST   | /encode          | Encode message into an image         |
| POST   | /decode          | Extract hidden message from image    |
| GET    | /health          | Service health check                 |
| GET    | /supported-formats | List supported image formats       |

#### Supported Formats
- PNG (recommended for lossless encoding)
- BMP
- TIFF

#### Technical Requirements
- Maximum file size: 10MB
- Message encryption: AES-256-GCM
- Capacity detection before encoding

### 4.2 IP Capture Service

#### Purpose
Capture, log, and analyze incoming IP addresses from HTTP requests while maintaining anonymity through proxy chains.

#### API Endpoints

| Method | Endpoint         | Description                          |
|--------|------------------|--------------------------------------|
| GET    | /capture         | Capture requester's IP address       |
| GET    | /logs            | Retrieve captured IP logs            |
| DELETE | /logs/:id        | Delete specific log entry            |
| GET    | /health          | Service health check                 |

#### Data Captured
- Source IP address
- Timestamp (UTC)
- User-Agent header
- Referrer (if available)
- Geolocation (optional, via GeoIP)

### 4.3 Orchestration Service

#### Purpose
Central coordinator for all service requests, handling routing, load balancing, and request validation.

#### API Endpoints

| Method | Endpoint              | Description                          |
|--------|----------------------|--------------------------------------|
| POST   | /api/steganography/* | Proxy to Steganography Engine        |
| GET    | /api/ip-capture/*    | Proxy to IP Capture Service          |
| GET    | /health              | Aggregate health status              |
| GET    | /metrics             | Service metrics                      |

---

## 5. Security Requirements

### 5.1 Network Security
- All inter-service communication over TLS 1.3
- Nginx SSL/TLS termination at the edge
- Rate limiting on all public endpoints
- IP-based access control lists

### 5.2 Data Security
- AES-256-GCM encryption for steganography payloads
- Secure key derivation using PBKDF2
- No plaintext storage of sensitive data
- Automatic log rotation and secure deletion

### 5.3 Anonymity Features
- ProxyChains integration for outbound requests
- Tor network support (optional)
- No correlation between requests and users

---

## 6. Performance Requirements

| Metric                  | Target                    |
|-------------------------|---------------------------|
| API Response Time       | < 200ms (95th percentile) |
| Image Encoding Time     | < 5s for 10MB image       |
| Concurrent Connections  | 1000+                     |
| Uptime                  | 99.9%                     |

---

## 7. Development Phases

### Phase 1 ✅
- [x] Project scaffolding and documentation
- [x] Basic service folder structure
- [x] Initial API endpoint definitions
- [x] Development environment setup

### Phase 2 ✅
- [x] Steganography Engine implementation
- [x] Unit tests for encoding/decoding
- [x] Docker containerization

### Phase 3 ✅
- [x] IP Capture Service implementation
- [x] Logging infrastructure
- [x] Database integration (SQLite)

### Phase 4 (Current)
- [ ] Orchestration Service implementation
- [ ] Inter-service communication
- [ ] Integration tests

### Phase 5
- [ ] Nginx reverse proxy configuration
- [ ] ProxyChains integration
- [ ] Security hardening
- [ ] Production deployment

---

## 8. Glossary

| Term              | Definition                                              |
|-------------------|--------------------------------------------------------|
| LSB               | Least Significant Bit - steganography technique         |
| Steganography     | Practice of hiding secret data within ordinary files    |
| ProxyChains       | Tool for routing connections through proxy servers      |
| Reverse Proxy     | Server that forwards requests to backend services       |

---

## 9. References

- [Steganography Techniques](https://en.wikipedia.org/wiki/Steganography)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [ProxyChains-NG](https://github.com/rofl0r/proxychains-ng)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

*Document Version: 1.0.0*
*Last Updated: Phase 1 Initial Release*
