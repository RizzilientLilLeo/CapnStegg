import { createComposite, validateImages, MIN_IMAGES, MAX_IMAGES } from '../../src/services/composite.service';
import Jimp from 'jimp';

// Helper function to create a minimal valid PNG buffer
async function createTestImage(width: number = 100, height: number = 100, color: number = 0xFF0000FF): Promise<Buffer> {
  const image = new Jimp(width, height, color);
  return await image.getBufferAsync(Jimp.MIME_PNG);
}

describe('Composite Service', () => {
  describe('validateImages', () => {
    it('should throw error when less than MIN_IMAGES are provided', async () => {
      const image = await createTestImage();
      
      await expect(validateImages([image])).rejects.toThrow(
        `At least ${MIN_IMAGES} images are required for compositing`
      );
    });
    
    it('should throw error when more than MAX_IMAGES are provided', async () => {
      const images: Buffer[] = [];
      for (let i = 0; i <= MAX_IMAGES; i++) {
        images.push(await createTestImage());
      }
      
      await expect(validateImages(images)).rejects.toThrow(
        `Maximum ${MAX_IMAGES} images allowed for compositing`
      );
    });
    
    it('should validate successfully with valid images', async () => {
      const images = [
        await createTestImage(100, 100, 0xFF0000FF),
        await createTestImage(100, 100, 0x00FF00FF)
      ];
      
      await expect(validateImages(images)).resolves.toBeUndefined();
    });
    
    it('should throw error for invalid image buffer', async () => {
      const validImage = await createTestImage();
      const invalidBuffer = Buffer.from('not an image');
      
      await expect(validateImages([validImage, invalidBuffer])).rejects.toThrow();
    });
  });
  
  describe('createComposite', () => {
    it('should create a composite image from multiple images', async () => {
      const images = [
        await createTestImage(100, 100, 0xFF0000FF),
        await createTestImage(80, 80, 0x00FF00FF)
      ];
      
      const result = await createComposite(images);
      
      expect(result).toBeDefined();
      expect(result.image).toBeInstanceOf(Buffer);
      expect(result.format).toBe('png');
      expect(result.imagesUsed).toBe(2);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
    
    it('should use largest dimensions for canvas size', async () => {
      const images = [
        await createTestImage(50, 100, 0xFF0000FF),
        await createTestImage(200, 50, 0x00FF00FF),
        await createTestImage(80, 150, 0x0000FFFF)
      ];
      
      const result = await createComposite(images);
      
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });
    
    it('should produce a valid PNG buffer', async () => {
      const images = [
        await createTestImage(100, 100, 0xFF0000FF),
        await createTestImage(100, 100, 0x00FF00FF)
      ];
      
      const result = await createComposite(images);
      
      // Verify PNG signature
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(result.image.slice(0, 8).equals(pngSignature)).toBe(true);
      
      // Verify can be read by Jimp
      const readImage = await Jimp.read(result.image);
      expect(readImage.getWidth()).toBe(result.width);
      expect(readImage.getHeight()).toBe(result.height);
    });
    
    it('should throw error for empty array', async () => {
      await expect(createComposite([])).rejects.toThrow(
        `At least ${MIN_IMAGES} images are required for compositing`
      );
    });
  });
  
  describe('constants', () => {
    it('should have MIN_IMAGES set to 2', () => {
      expect(MIN_IMAGES).toBe(2);
    });
    
    it('should have MAX_IMAGES set to 10', () => {
      expect(MAX_IMAGES).toBe(10);
    });
  });
});
