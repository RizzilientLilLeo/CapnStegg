# Contributing to CapnStegg

Thank you for your interest in contributing to CapnStegg! This document provides guidelines and information for contributors.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Guidelines](#issue-guidelines)
8. [Documentation](#documentation)
9. [Testing](#testing)
10. [Security](#security)

---

## Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors. We expect everyone to:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that could be considered inappropriate

---

## Getting Started

### Prerequisites

- Node.js v18 LTS or higher
- Docker and Docker Compose
- Git
- A code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/CapnStegg.git
   cd CapnStegg
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/RizzilientLilLeo/CapnStegg.git
   ```

3. **Install Dependencies**
   ```bash
   # When services are implemented, install dependencies
   # npm install (in each service directory)
   ```

4. **Set Up Environment**
   ```bash
   # Copy environment templates
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Start Development Services**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

---

## Development Workflow

### Branching Strategy

We use a simplified Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Feature Branch

```bash
# Update your local main
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Work on your changes...

# Push to your fork
git push origin feature/your-feature-name
```

---

## Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types
function processImage(image: Buffer, options: ProcessOptions): Promise<Result> {
  // ...
}

// Use interfaces for object shapes
interface ProcessOptions {
  format: ImageFormat;
  quality: number;
  preserveMetadata?: boolean;
}

// Use enums for fixed sets of values
enum ImageFormat {
  PNG = 'png',
  BMP = 'bmp',
  TIFF = 'tiff',
}

// Prefer const and let over var
const MAX_FILE_SIZE = 10 * 1024 * 1024;
let currentFile: Buffer | null = null;
```

### Naming Conventions

| Type         | Convention        | Example                  |
|--------------|-------------------|--------------------------|
| Files        | kebab-case        | `image-encoder.ts`       |
| Classes      | PascalCase        | `ImageEncoder`           |
| Functions    | camelCase         | `encodeMessage()`        |
| Constants    | SCREAMING_SNAKE   | `MAX_FILE_SIZE`          |
| Interfaces   | PascalCase with I | `IEncoder` or `Encoder`  |
| Types        | PascalCase        | `EncodingResult`         |

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line arrays/objects
- Maximum line length: 100 characters
- Always use semicolons

### ESLint and Prettier

The project uses ESLint and Prettier for code formatting:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

---

## Commit Guidelines

### Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                          |
|------------|--------------------------------------|
| `feat`     | New feature                          |
| `fix`      | Bug fix                              |
| `docs`     | Documentation changes                |
| `style`    | Code style changes (formatting)      |
| `refactor` | Code refactoring                     |
| `test`     | Adding or updating tests             |
| `chore`    | Maintenance tasks                    |
| `perf`     | Performance improvements             |

### Examples

```bash
# Good commit messages
git commit -m "feat(steganography): add PNG encoding support"
git commit -m "fix(ip-capture): resolve memory leak in log storage"
git commit -m "docs: update README with installation instructions"
git commit -m "test(orchestration): add unit tests for router service"

# Bad commit messages
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "asdfasdf"
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Run linter**
   ```bash
   npm run lint
   ```

4. **Update documentation** if needed

### Submitting a Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Fill out the PR template:
   - Description of changes
   - Related issue number
   - Type of change
   - Testing performed
   - Checklist completed

### PR Template

```markdown
## Description
Brief description of the changes

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the tests you ran

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] I have updated the documentation accordingly
```

### Review Process

1. At least one maintainer review is required
2. All CI checks must pass
3. Resolve any requested changes
4. Squash commits if requested

---

## Issue Guidelines

### Creating an Issue

#### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages
- Screenshots if applicable

#### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Proposed solution (if any)
- Alternative solutions considered

### Issue Labels

| Label          | Description                    |
|----------------|--------------------------------|
| `bug`          | Something isn't working        |
| `enhancement`  | New feature request            |
| `documentation`| Documentation improvements     |
| `good first issue` | Good for newcomers        |
| `help wanted`  | Extra attention needed         |
| `priority-high`| Critical issue                 |
| `wontfix`      | Will not be addressed          |

---

## Documentation

### Documentation Standards

- Use Markdown for all documentation
- Include code examples where appropriate
- Keep language clear and concise
- Update README when adding features
- Add JSDoc comments for public APIs

### JSDoc Example

```typescript
/**
 * Encodes a message into an image using LSB steganography.
 * 
 * @param image - The carrier image as a Buffer
 * @param message - The secret message to encode
 * @param options - Encoding options
 * @returns Promise resolving to the encoded image
 * @throws {ValidationError} If the image format is unsupported
 * @throws {CapacityError} If the message is too large for the image
 * 
 * @example
 * ```typescript
 * const encodedImage = await encoder.encode(imageBuffer, 'secret message', {
 *   password: 'mypassword',
 *   compression: true,
 * });
 * ```
 */
async encode(
  image: Buffer,
  message: string,
  options?: EncodingOptions
): Promise<Buffer> {
  // Implementation
}
```

---

## Testing

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/            # End-to-end tests
```

### Writing Tests

```typescript
describe('ImageEncoder', () => {
  describe('encode()', () => {
    it('should encode a message into a PNG image', async () => {
      // Arrange
      const image = await loadTestImage('test.png');
      const message = 'secret message';
      
      // Act
      const result = await encoder.encode(image, message);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.format).toBe('png');
    });

    it('should throw CapacityError when message is too large', async () => {
      // Arrange
      const smallImage = await loadTestImage('small.png');
      const largeMessage = 'x'.repeat(1000000);
      
      // Act & Assert
      await expect(encoder.encode(smallImage, largeMessage))
        .rejects.toThrow(CapacityError);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- encoder.test.ts

# Watch mode
npm run test:watch
```

---

## Security

### Reporting Vulnerabilities

**DO NOT** open a public issue for security vulnerabilities.

Instead, please email security concerns to the maintainers directly or use GitHub's private vulnerability reporting feature.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines

When contributing code:
- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate and sanitize all inputs
- Follow secure coding practices
- Update dependencies regularly

---

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label

Thank you for contributing to CapnStegg!

---

*Document Version: 1.0.0*
*Last Updated: Phase 1 Initial Release*
