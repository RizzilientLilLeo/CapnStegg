import { encrypt, decrypt, getEncryptionOverhead } from '../../src/services/encryption.service';

describe('Encryption Service', () => {
  const testPassword = 'testPassword123!';

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a simple message', () => {
      const message = 'Hello, World!';
      const encrypted = encrypt(message, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(message);
    });

    it('should encrypt and decrypt unicode message', () => {
      const message = 'Hello 世界 🌍';
      const encrypted = encrypt(message, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(message);
    });

    it('should encrypt and decrypt empty message', () => {
      const message = '';
      const encrypted = encrypt(message, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(message);
    });

    it('should encrypt and decrypt long message', () => {
      const message = 'A'.repeat(10000);
      const encrypted = encrypt(message, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(message);
    });

    it('should produce different ciphertext for same message', () => {
      const message = 'Hello, World!';
      const encrypted1 = encrypt(message, testPassword);
      const encrypted2 = encrypt(message, testPassword);
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should fail with wrong password', () => {
      const message = 'Secret message';
      const encrypted = encrypt(message, testPassword);
      expect(() => decrypt(encrypted, 'wrongPassword')).toThrow();
    });
  });

  describe('getEncryptionOverhead', () => {
    it('should return correct overhead value', () => {
      const overhead = getEncryptionOverhead();
      // 32 bytes salt + 16 bytes IV + 16 bytes tag = 64 bytes
      expect(overhead).toBe(64);
    });
  });
});
