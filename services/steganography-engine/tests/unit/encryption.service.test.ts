import { EncryptionService } from '../../src/services/encryption.service';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a message successfully', () => {
      const message = 'Hello, World!';
      const password = 'test-password-123';

      const encrypted = encryptionService.encrypt(message, password);
      const decrypted = encryptionService.decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });

    it('should produce different ciphertext for same message with same password', () => {
      const message = 'Test message';
      const password = 'password123';

      const encrypted1 = encryptionService.encrypt(message, password);
      const encrypted2 = encryptionService.encrypt(message, password);

      // Should be different due to random salt and IV
      expect(encrypted1.equals(encrypted2)).toBe(false);
    });

    it('should fail to decrypt with wrong password', () => {
      const message = 'Secret message';
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';

      const encrypted = encryptionService.encrypt(message, correctPassword);

      expect(() => {
        encryptionService.decrypt(encrypted, wrongPassword);
      }).toThrow('Decryption failed');
    });

    it('should handle empty messages', () => {
      const message = '';
      const password = 'password';

      const encrypted = encryptionService.encrypt(message, password);
      const decrypted = encryptionService.decrypt(encrypted, password);

      expect(decrypted).toBe('');
    });

    it('should handle unicode messages', () => {
      const message = '你好世界! 🎉 Здравствуй мир!';
      const password = 'unicode-test';

      const encrypted = encryptionService.encrypt(message, password);
      const decrypted = encryptionService.decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });

    it('should handle long messages', () => {
      const message = 'A'.repeat(10000);
      const password = 'long-message-test';

      const encrypted = encryptionService.encrypt(message, password);
      const decrypted = encryptionService.decrypt(encrypted, password);

      expect(decrypted).toBe(message);
    });
  });

  describe('getEncryptionOverhead', () => {
    it('should return the correct overhead value', () => {
      const overhead = encryptionService.getEncryptionOverhead();
      // Salt (16) + IV (12) + AuthTag (16) = 44
      expect(overhead).toBe(44);
    });
  });
});
