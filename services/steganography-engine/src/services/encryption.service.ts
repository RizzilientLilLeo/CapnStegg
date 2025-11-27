import crypto, { CipherGCM, DecipherGCM } from 'crypto';
import logger from '../utils/logger';

const ALGORITHM = 'aes-256-gcm' as const;
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export class EncryptionService {
  /**
   * Derives a key from a password using PBKDF2
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypts a message using AES-256-GCM
   * Format: [salt (16)] [iv (12)] [authTag (16)] [ciphertext]
   */
  encrypt(message: string, password: string): Buffer {
    try {
      const salt = crypto.randomBytes(SALT_LENGTH);
      const key = this.deriveKey(password, salt);
      const iv = crypto.randomBytes(IV_LENGTH);

      const cipher: CipherGCM = crypto.createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(message, 'utf8'),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();

      // Combine all parts: salt + iv + authTag + ciphertext
      return Buffer.concat([salt, iv, authTag, encrypted]);
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts a message using AES-256-GCM
   */
  decrypt(encryptedData: Buffer, password: string): string {
    try {
      // Extract components
      const salt = encryptedData.subarray(0, SALT_LENGTH);
      const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = encryptedData.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );
      const ciphertext = encryptedData.subarray(
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );

      const key = this.deriveKey(password, salt);

      const decipher: DecipherGCM = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed', { error });
      throw new Error('Decryption failed - invalid password or corrupted data');
    }
  }

  /**
   * Gets the overhead added by encryption (salt + iv + authTag)
   */
  getEncryptionOverhead(): number {
    return SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
  }
}

export const encryptionService = new EncryptionService();
export default encryptionService;
