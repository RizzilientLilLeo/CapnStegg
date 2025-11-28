# CapnStegg

A modular steganography and IP capture tool built with a microservices architecture for secure, privacy-focused operations.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Phase](https://img.shields.io/badge/phase-1-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

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

Encodes and decodes hidden messages within image files.

| Endpoint             | Method | Description                    |
|----------------------|--------|--------------------------------|
| `/encode`            | POST   | Encode message into image      |
| `/decode`            | POST   | Extract message from image     |
| `/composite`         | POST   | Generate composite image from multiple images |
| `/health`            | GET    | Health check                   |
| `/supported-formats` | GET    | List supported formats         |

### IP Capture Service (Port 3002)

Captures and logs incoming IP addresses with privacy features.

| Endpoint      | Method | Description                    |
|---------------|--------|--------------------------------|
| `/capture`    | GET    | Capture requester's IP         |
| `/logs`       | GET    | Retrieve captured logs         |
| `/logs/:id`   | DELETE | Delete specific log            |
| `/health`     | GET    | Health check                   |

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
