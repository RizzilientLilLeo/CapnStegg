# Steganography Engine Service

## Overview

The Steganography Engine is responsible for encoding and decoding hidden messages within image files using LSB (Least Significant Bit) steganography.

## Features

- **Message Encoding**: Hide secret messages within images
- **Message Decoding**: Extract hidden messages from images
- **Encryption**: AES-256-GCM encryption for payload security
- **Format Support**: PNG, BMP, TIFF formats
- **Capacity Detection**: Calculate available space before encoding

## API Endpoints

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| POST   | `/encode`          | Encode message into an image       |
| POST   | `/decode`          | Extract hidden message from image  |
| GET    | `/health`          | Service health check               |
| GET    | `/supported-formats` | List supported image formats     |

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

| Variable          | Default     | Description                 |
|-------------------|-------------|-----------------------------|
| `PORT`            | `3001`      | Service port                |
| `NODE_ENV`        | `development` | Environment               |
| `LOG_LEVEL`       | `info`      | Logging level               |
| `MAX_FILE_SIZE`   | `10485760`  | Max file size (10MB)        |

## Directory Structure

```
steganography-engine/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express application
│   ├── config/               # Configuration
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── routes/               # API routes
│   ├── middleware/           # Express middleware
│   └── utils/                # Utility functions
├── tests/                    # Test files
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Status

🚧 **Phase 1**: Scaffolding and documentation complete

---

*See the main [README](../../README.md) for project overview.*
