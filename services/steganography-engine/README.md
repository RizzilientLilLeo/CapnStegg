# Steganography Engine Service

## Overview

The Steganography Engine is responsible for encoding and decoding hidden messages within image files using LSB (Least Significant Bit) steganography.

## Features

- **Message Encoding**: Hide secret messages within images
- **Message Decoding**: Extract hidden messages from images
- **Encryption**: AES-256-GCM encryption for payload security
- **Format Support**: PNG, BMP, TIFF formats
- **Capacity Detection**: Calculate available space before encoding
- **Composite Image Generation**: Create composite images by randomly overlaying multiple images

## API Endpoints

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| POST   | `/encode`          | Encode message into an image       |
| POST   | `/decode`          | Extract hidden message from image  |
| POST   | `/composite`       | Generate composite image from multiple images |
| GET    | `/health`          | Service health check               |
| GET    | `/supported-formats` | List supported image formats     |

### POST /composite

Generate a composite image by randomly overlaying multiple images.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field: `images` (2-10 image files, supported formats: PNG, BMP, TIFF)

**Example:**
```bash
curl -X POST http://localhost:3001/composite \
  -F "images=@image1.png" \
  -F "images=@image2.png" \
  -F "images=@image3.png" \
  -o composite.png
```

**Response:**
- Content-Type: `image/png`
- Headers include:
  - `X-Images-Used`: Number of images used
  - `X-Output-Width`: Width of composite image
  - `X-Output-Height`: Height of composite image

**Features:**
- Randomly positions images on canvas
- Applies random rotation (0°, 90°, 180°, 270°)
- Uses random blend modes for artistic effects
- Applies random opacity (30-100%)
- Canvas size is determined by the largest image dimensions

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

✅ **Phase 2**: Implementation complete

---

*See the main [README](../../README.md) for project overview.*
