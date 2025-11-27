import { hashIP, truncateIP, isValidIP, extractIP } from '../../src/services/anonymization.service';

describe('Anonymization Service', () => {
  describe('hashIP', () => {
    it('should hash an IPv4 address', () => {
      const ip = '192.168.1.1';
      const hash = hashIP(ip);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should produce consistent hashes', () => {
      const ip = '192.168.1.1';
      const hash1 = hashIP(ip);
      const hash2 = hashIP(ip);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different IPs', () => {
      const hash1 = hashIP('192.168.1.1');
      const hash2 = hashIP('192.168.1.2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('truncateIP', () => {
    it('should truncate IPv4 address', () => {
      const ip = '192.168.1.100';
      const truncated = truncateIP(ip);
      
      expect(truncated).toBe('192.168.1.x');
    });

    it('should truncate IPv6 address', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const truncated = truncateIP(ip);
      
      expect(truncated).toBe('2001:0db8:85a3:x:x:x:x:x');
    });
  });

  describe('isValidIP', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIP('192.168.1.1')).toBe(true);
      expect(isValidIP('10.0.0.1')).toBe(true);
      expect(isValidIP('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIP('256.1.1.1')).toBe(false);
      expect(isValidIP('192.168.1')).toBe(false);
      expect(isValidIP('not-an-ip')).toBe(false);
    });

    it('should validate correct IPv6 addresses', () => {
      expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });
  });

  describe('extractIP', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const ip = extractIP('10.0.0.1', '192.168.1.1, 10.0.0.2');
      expect(ip).toBe('192.168.1.1');
    });

    it('should fall back to remote address if no X-Forwarded-For', () => {
      const ip = extractIP('192.168.1.1', undefined);
      expect(ip).toBe('192.168.1.1');
    });

    it('should remove IPv6 prefix from remote address', () => {
      const ip = extractIP('::ffff:192.168.1.1', undefined);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return unknown for undefined addresses', () => {
      const ip = extractIP(undefined, undefined);
      expect(ip).toBe('unknown');
    });
  });
});
