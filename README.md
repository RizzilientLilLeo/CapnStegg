# CapnStegg

A modular steganography and IP capture tool built with a microservices architecture for secure, privacy-focused operations.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Phase](https://img.shields.io/badge/phase-production--ready-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tests](https://img.shields.io/badge/tests-64%20passing-brightgreen.svg)

---

## Overview

CapnStegg is designed to hide secret messages within image files using steganography techniques while providing IP capture capabilities for tracking and analysis. The project emphasizes security, privacy, and modularity through a microservices architecture.

### Key Features

- **Steganography Engine**: Encode and decode hidden messages in images using LSB (Least Significant Bit) techniques
- **IP Capture Service**: Capture and analyze incoming IP addresses with privacy-preserving features
- **Orchestration Layer**: Central coordination of all services with load balancing and health monitoring
- **Privacy-First Design**: ProxyChains integration for anonymity, IP anonymization, and secure logging
- **Production-Ready Infrastructure**: Debian server deployment with Nginx reverse proxy

---

## Architecture

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
└───────────────────┘   └───────────────────┘
```

---

## Quick Start

### Prerequisites

- **Node.js**: v18 LTS or higher
- **Docker**: v20.10 or higher (with Docker Compose)
- **Git**: Latest version

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/RizzilientLilLeo/CapnStegg.git
   cd CapnStegg
   ```

2. **Set Up Environment Variables**
   ```bash
   # Copy environment templates for each service
   cp services/steganography-engine/.env.example services/steganography-engine/.env
   cp services/ip-capture/.env.example services/ip-capture/.env
   cp services/orchestration/.env.example services/orchestration/.env
   ```

3. **Start with Docker Compose**
   ```bash
   # Development mode
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

   # Production mode
   docker-compose up -d
   ```

4. **Verify Installation**
   ```bash
   # Check health endpoint
   curl http://localhost:3000/health
   ```

### Manual Installation (Without Docker)

```bash
# Install dependencies for each service
cd services/steganography-engine && npm install
cd ../ip-capture && npm install
cd ../orchestration && npm install

# Start each service
npm run dev
```

---

## Project Structure

```
CapnStegg/
├── docs/                          # Project documentation
│   ├── TECHNICAL_SPECIFICATION.md # Technical specs and API docs
│   ├── LOGGING_STRATEGY.md        # Logging architecture
│   ├── MODULAR_CODE_PLAN.md       # Module design and patterns
│   └── INFRASTRUCTURE.md          # Server and deployment docs
│
├── services/                      # Microservices
│   ├── steganography-engine/      # Image encoding/decoding service
│   ├── ip-capture/                # IP capture and logging service
│   └── orchestration/             # API gateway and coordination
│
├── shared/                        # Shared libraries (planned)
│   ├── logger/                    # Common logging module
│   ├── config/                    # Shared configuration
│   └── types/                     # Shared TypeScript types
│
├── infrastructure/                # Infrastructure configs (planned)
│   ├── docker/                    # Docker configurations
│   ├── nginx/                     # Nginx configurations
│   └── proxychains/               # ProxyChains configurations
│
├── docker-compose.yml             # Production compose file
├── docker-compose.dev.yml         # Development overrides
├── CONTRIBUTING.md                # Contribution guidelines
└── README.md                      # This file
```

---

## Services

### Steganography Engine (Port 3001)

Encodes and decodes hidden messages within image files using LSB steganography with optional AES-256-GCM encryption.

| Endpoint             | Method | Description                    |
|----------------------|--------|--------------------------------|
| `/encode`            | POST   | Encode message into image      |
| `/decode`            | POST   | Extract message from image     |
| `/capacity`          | POST   | Calculate message capacity     |
| `/health`            | GET    | Health check                   |
| `/supported-formats` | GET    | List supported formats         |

**Example: Encode a message**
```bash
curl -X POST http://localhost:3001/encode \
  -F "image=@input.png" \
  -F "message=Secret message" \
  -F "password=optional-encryption-key" \
  -o encoded.png
```

**Example: Decode a message**
```bash
curl -X POST http://localhost:3001/decode \
  -F "image=@encoded.png" \
  -F "password=optional-encryption-key"
```

### IP Capture Service (Port 3002)

Captures and logs incoming IP addresses with privacy features (SHA-256 hashing).

| Endpoint      | Method | Description                    |
|---------------|--------|--------------------------------|
| `/capture`    | GET    | Capture requester's IP         |
| `/logs`       | GET    | Retrieve captured logs         |
| `/logs/:id`   | GET    | Get specific log entry         |
| `/logs/:id`   | DELETE | Delete specific log            |
| `/stats`      | GET    | Get capture statistics         |
| `/health`     | GET    | Health check                   |

**Example: Capture IP**
```bash
curl http://localhost:3002/capture
```

**Example: Get logs with pagination**
```bash
curl "http://localhost:3002/logs?limit=10&offset=0"
```

### Orchestration Service (Port 3000)

Central API gateway that routes requests to backend services.

| Endpoint              | Method   | Description                    |
|-----------------------|----------|--------------------------------|
| `/api/steganography/*`| POST/GET | Proxy to Steganography Engine  |
| `/api/ip-capture/*`   | GET      | Proxy to IP Capture Service    |
| `/health`             | GET      | Aggregate health status        |
| `/metrics`            | GET      | Service metrics                |

---

## Documentation

| Document                                                      | Description                         |
|---------------------------------------------------------------|-------------------------------------|
| [Technical Specification](docs/TECHNICAL_SPECIFICATION.md)    | System architecture and API specs   |
| [Logging Strategy](docs/LOGGING_STRATEGY.md)                  | Logging architecture and standards  |
| [Modular Code Plan](docs/MODULAR_CODE_PLAN.md)                | Module design patterns              |
| [Infrastructure](docs/INFRASTRUCTURE.md)                      | Deployment and server setup         |
| [Contributing](CONTRIBUTING.md)                               | Contribution guidelines             |

---

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific service tests
cd services/steganography-engine && npm test
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Building for Production

```bash
# Build all services
npm run build

# Build Docker images
docker-compose build
```

---

## Deployment

### Production Deployment (Debian Server)

1. **Server Setup**
   - Follow [Infrastructure Guide](docs/INFRASTRUCTURE.md) for Debian server configuration
   - Install Docker, Nginx, and required packages

2. **SSL Configuration**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Deploy Services**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

4. **Configure Nginx**
   - See [Infrastructure Guide](docs/INFRASTRUCTURE.md#nginx-reverse-proxy) for configuration

### ProxyChains Setup

For anonymity, configure ProxyChains:

```bash
# Install ProxyChains
sudo apt install proxychains4

# Configure proxies in /etc/proxychains4.conf
# See Infrastructure Guide for details
```

---

## Roadmap

### Phase 1 ✅
- [x] Project scaffolding and documentation
- [x] Service folder structure
- [x] API endpoint definitions
- [x] Development environment setup

### Phase 2 ✅
- [x] Steganography Engine implementation
- [x] LSB encoding/decoding with AES-256-GCM encryption
- [x] Unit tests for encoding/decoding (24 tests)
- [x] Docker containerization

### Phase 3 ✅
- [x] IP Capture Service implementation
- [x] SHA-256 IP hashing and anonymization
- [x] SQLite database integration
- [x] Unit tests (32 tests)
- [x] Docker containerization

### Phase 4 ✅
- [x] Orchestration Service implementation
- [x] Inter-service communication and proxying
- [x] Health aggregation across services
- [x] Rate limiting middleware
- [x] Unit tests (8 tests)
- [x] Docker containerization

### Phase 5 (Infrastructure Ready)
- [x] Docker Compose production configuration
- [x] Multi-stage Dockerfiles for all services
- [x] Health checks configured
- [ ] Nginx reverse proxy deployment (see docs/INFRASTRUCTURE.md)
- [ ] ProxyChains integration
- [ ] SSL/TLS configuration

---

## Troubleshooting

### Common Issues and Solutions

#### Docker Build Failures

**Issue**: `sharp` or `better-sqlite3` compilation errors on build
```
Error: Cannot find module 'sharp'
```

**Solution**: These native modules require build tools. The Dockerfiles include the necessary dependencies, but if building locally:
```bash
# On Alpine Linux
apk add --no-cache python3 make g++ vips-dev

# On Ubuntu/Debian
apt-get install -y build-essential libvips-dev
```

#### Service Connection Refused

**Issue**: Orchestration service returns 503 when proxying requests
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Backend service is not available"
  }
}
```

**Solution**: 
1. Verify all services are running: `docker-compose ps`
2. Check service health: `curl http://localhost:3000/health`
3. Ensure services are on the same Docker network
4. Check environment variables for service URLs

#### Image Format Not Supported

**Issue**: Steganography encoding fails with "Unsupported file type"

**Solution**: Only lossless formats are supported to preserve encoded data:
- PNG (recommended)
- BMP
- TIFF

JPEG and other lossy formats will corrupt hidden data.

#### Rate Limiting Errors

**Issue**: Receiving 429 Too Many Requests
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

**Solution**: Default rate limit is 100 requests per 60 seconds. Adjust via environment variables:
```bash
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW=120
```

#### Database Locked (IP Capture)

**Issue**: SQLite "database is locked" error under high concurrency

**Solution**: 
1. Use connection pooling (already implemented)
2. For high-throughput production, consider switching to PostgreSQL
3. Ensure only one process accesses the database file

#### Memory Issues with Large Images

**Issue**: Out of memory when processing large images

**Solution**: 
1. Default max file size is 10MB. Adjust via:
   ```bash
   MAX_FILE_SIZE=20971520  # 20MB
   ```
2. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Development Tips

1. **Testing individual services**: Each service can be run independently:
   ```bash
   cd services/steganography-engine
   npm run dev
   ```

2. **Viewing logs**: Use Docker Compose logs with follow:
   ```bash
   docker-compose logs -f steganography
   ```

3. **Rebuilding after changes**: Force rebuild with no cache:
   ```bash
   docker-compose build --no-cache steganography
   ```

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Pull request process

---

## Security

For security vulnerabilities, please do NOT open a public issue. Instead, email the maintainers directly or use GitHub's private vulnerability reporting.

See [CONTRIBUTING.md](CONTRIBUTING.md#security) for more details.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- [Steganography Techniques](https://en.wikipedia.org/wiki/Steganography)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [ProxyChains-NG](https://github.com/rofl0r/proxychains-ng)

---

*Built with ❤️ by the CapnStegg Team*
