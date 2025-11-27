import { hashIP, extractIP, isValidIP, anonymizeIP } from '../../src/utils/ip.utils';

describe('IP Utils', () => {
  describe('hashIP', () => {
    it('should hash an IP address consistently', () => {
      const ip = '192.168.1.1';
      const hash1 = hashIP(ip);
      const hash2 = hashIP(ip);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should produce different hashes for different IPs', () => {
      const hash1 = hashIP('192.168.1.1');
      const hash2 = hashIP('192.168.1.2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle IPv6 addresses', () => {
      const hash = hashIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      expect(hash).toHaveLength(64);
    });
  });

  describe('extractIP', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
        }
      };

      const ip = extractIP(req);
      expect(ip).toBe('203.0.113.195');
    });

    it('should extract IP from X-Real-IP header', () => {
      const req = {
        headers: {
          'x-real-ip': '203.0.113.195'
        }
      };

      const ip = extractIP(req);
      expect(ip).toBe('203.0.113.195');
    });

    it('should fall back to req.ip', () => {
      const req = {
        headers: {},
        ip: '192.168.1.100'
      };

      const ip = extractIP(req);
      expect(ip).toBe('192.168.1.100');
    });

    it('should fall back to socket.remoteAddress', () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '10.0.0.1'
        }
      };

      const ip = extractIP(req);
      expect(ip).toBe('10.0.0.1');
    });

    it('should return default IP when nothing is available', () => {
      const req = {
        headers: {}
      };

      const ip = extractIP(req);
      expect(ip).toBe('0.0.0.0');
    });

    it('should prefer X-Forwarded-For over X-Real-IP', () => {
      const req = {
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'x-real-ip': '2.2.2.2'
        }
      };

      const ip = extractIP(req);
      expect(ip).toBe('1.1.1.1');
    });
  });

  describe('isValidIP', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIP('192.168.1.1')).toBe(true);
      expect(isValidIP('0.0.0.0')).toBe(true);
      expect(isValidIP('255.255.255.255')).toBe(true);
      expect(isValidIP('10.0.0.1')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIP('256.1.1.1')).toBe(false);
      expect(isValidIP('192.168.1')).toBe(false);
      expect(isValidIP('192.168.1.1.1')).toBe(false);
      expect(isValidIP('not.an.ip.address')).toBe(false);
    });

    it('should validate IPv6 localhost', () => {
      expect(isValidIP('::1')).toBe(true);
    });

    it('should validate full IPv6 addresses', () => {
      expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should validate IPv4-mapped IPv6 addresses', () => {
      expect(isValidIP('::ffff:192.168.1.1')).toBe(true);
    });
  });

  describe('anonymizeIP', () => {
    it('should anonymize IPv4 by zeroing last octet', () => {
      const anonymized = anonymizeIP('192.168.1.100');
      expect(anonymized).toBe('192.168.1.0');
    });

    it('should anonymize different IPv4 addresses', () => {
      expect(anonymizeIP('10.0.0.55')).toBe('10.0.0.0');
      expect(anonymizeIP('172.16.50.200')).toBe('172.16.50.0');
    });

    it('should anonymize IPv6 by keeping first 4 groups', () => {
      const anonymized = anonymizeIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      expect(anonymized).toBe('2001:0db8:85a3:0000::');
    });
  });
});
