import sharp from 'sharp';
import { SteganographyService } from '../../src/services/steganography.service';

describe('SteganographyService', () => {
  let steganographyService: SteganographyService;
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    // Create a test image (100x100 PNG)
    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 128, b: 64 }
      }
    })
      .png()
      .toBuffer();
  });

  beforeEach(() => {
    steganographyService = new SteganographyService();
  });

  describe('getCapacity', () => {
    it('should calculate capacity for a valid image', async () => {
      const capacity = await steganographyService.getCapacity(testImageBuffer);

      expect(capacity.totalCapacity).toBeGreaterThan(0);
      expect(capacity.availableBytes).toBeGreaterThan(0);
      expect(capacity.dimensions.width).toBe(100);
      expect(capacity.dimensions.height).toBe(100);
    });

    it('should return correct dimensions', async () => {
      const customImage = await sharp({
        create: {
          width: 200,
          height: 150,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      })
        .png()
        .toBuffer();

      const capacity = await steganographyService.getCapacity(customImage);

      expect(capacity.dimensions.width).toBe(200);
      expect(capacity.dimensions.height).toBe(150);
    });

    it('should throw error for invalid image data', async () => {
      const invalidBuffer = Buffer.from('not an image');

      await expect(steganographyService.getCapacity(invalidBuffer)).rejects.toThrow();
    });
  });

  describe('encode and decode', () => {
    it('should encode and decode a simple message', async () => {
      const message = 'Hello, Steganography!';

      const encoded = await steganographyService.encode(testImageBuffer, message);
      expect(encoded.success).toBe(true);
      expect(encoded.imageBuffer).toBeDefined();

      const decoded = await steganographyService.decode(encoded.imageBuffer!);
      expect(decoded.success).toBe(true);
      expect(decoded.message).toBe(message);
      expect(decoded.metadata.encrypted).toBe(false);
    });

    it('should encode and decode with encryption', async () => {
      const message = 'Secret Message!';
      const password = 'test-password';

      const encoded = await steganographyService.encode(testImageBuffer, message, password);
      expect(encoded.success).toBe(true);

      const decoded = await steganographyService.decode(encoded.imageBuffer!, password);
      expect(decoded.success).toBe(true);
      expect(decoded.message).toBe(message);
      expect(decoded.metadata.encrypted).toBe(true);
    });

    it('should fail to decode encrypted message without password', async () => {
      const message = 'Secret Message';
      const password = 'my-password';

      const encoded = await steganographyService.encode(testImageBuffer, message, password);

      await expect(steganographyService.decode(encoded.imageBuffer!)).rejects.toThrow(
        'Password required to decode encrypted message'
      );
    });

    it('should fail to decode with wrong password', async () => {
      const message = 'Secret';
      const correctPassword = 'correct';
      const wrongPassword = 'wrong';

      const encoded = await steganographyService.encode(testImageBuffer, message, correctPassword);

      await expect(
        steganographyService.decode(encoded.imageBuffer!, wrongPassword)
      ).rejects.toThrow('Decryption failed');
    });

    it('should handle empty messages', async () => {
      const message = '';

      const encoded = await steganographyService.encode(testImageBuffer, message);
      const decoded = await steganographyService.decode(encoded.imageBuffer!);

      expect(decoded.message).toBe('');
    });

    it('should handle unicode messages', async () => {
      const message = '日本語テスト 🚀 émojis работает';

      const encoded = await steganographyService.encode(testImageBuffer, message);
      const decoded = await steganographyService.decode(encoded.imageBuffer!);

      expect(decoded.message).toBe(message);
    });

    it('should throw error for message too large', async () => {
      const capacity = await steganographyService.getCapacity(testImageBuffer);
      const tooLargeMessage = 'A'.repeat(capacity.availableBytes + 100);

      await expect(
        steganographyService.encode(testImageBuffer, tooLargeMessage)
      ).rejects.toThrow('Message too large');
    });

    it('should output PNG format', async () => {
      const message = 'Test';

      const encoded = await steganographyService.encode(testImageBuffer, message);
      expect(encoded.format).toBe('png');
    });
  });

  describe('format validation', () => {
    it('should report png as supported', () => {
      expect(steganographyService.isFormatSupported('png')).toBe(true);
    });

    it('should report bmp as supported', () => {
      expect(steganographyService.isFormatSupported('bmp')).toBe(true);
    });

    it('should report tiff as supported', () => {
      expect(steganographyService.isFormatSupported('tiff')).toBe(true);
    });

    it('should report jpg as unsupported', () => {
      expect(steganographyService.isFormatSupported('jpg')).toBe(false);
    });

    it('should return list of supported formats', () => {
      const formats = steganographyService.getSupportedFormats();
      expect(formats).toContain('png');
      expect(formats).toContain('bmp');
      expect(formats).toContain('tiff');
    });
  });

  describe('error detection', () => {
    it('should detect when no hidden message exists', async () => {
      // A fresh image without any encoded data
      await expect(steganographyService.decode(testImageBuffer)).rejects.toThrow(
        'No hidden message found'
      );
    });
  });
});
