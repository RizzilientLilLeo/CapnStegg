import {
  getLSB,
  setLSB,
  stringToBinary,
  binaryToString,
  numberTo32BitBinary,
  binaryTo32BitNumber
} from '../../src/utils/bit.utils';

describe('Bit Utilities', () => {
  describe('getLSB', () => {
    it('should return 0 for even numbers', () => {
      expect(getLSB(0)).toBe(0);
      expect(getLSB(2)).toBe(0);
      expect(getLSB(254)).toBe(0);
    });

    it('should return 1 for odd numbers', () => {
      expect(getLSB(1)).toBe(1);
      expect(getLSB(3)).toBe(1);
      expect(getLSB(255)).toBe(1);
    });
  });

  describe('setLSB', () => {
    it('should set LSB to 0', () => {
      expect(setLSB(255, 0)).toBe(254);
      expect(setLSB(1, 0)).toBe(0);
    });

    it('should set LSB to 1', () => {
      expect(setLSB(0, 1)).toBe(1);
      expect(setLSB(254, 1)).toBe(255);
    });

    it('should not change if already set', () => {
      expect(setLSB(255, 1)).toBe(255);
      expect(setLSB(0, 0)).toBe(0);
    });
  });

  describe('stringToBinary and binaryToString', () => {
    it('should convert simple ASCII string', () => {
      const original = 'Hello';
      const binary = stringToBinary(original);
      const result = binaryToString(binary);
      expect(result).toBe(original);
    });

    it('should handle empty string', () => {
      const binary = stringToBinary('');
      expect(binary).toBe('');
      expect(binaryToString(binary)).toBe('');
    });

    it('should handle unicode characters', () => {
      const original = 'Hello 世界';
      const binary = stringToBinary(original);
      const result = binaryToString(binary);
      expect(result).toBe(original);
    });
  });

  describe('numberTo32BitBinary and binaryTo32BitNumber', () => {
    it('should convert small numbers', () => {
      expect(binaryTo32BitNumber(numberTo32BitBinary(0))).toBe(0);
      expect(binaryTo32BitNumber(numberTo32BitBinary(1))).toBe(1);
      expect(binaryTo32BitNumber(numberTo32BitBinary(100))).toBe(100);
    });

    it('should convert large numbers', () => {
      expect(binaryTo32BitNumber(numberTo32BitBinary(1000000))).toBe(1000000);
      expect(binaryTo32BitNumber(numberTo32BitBinary(4294967295))).toBe(4294967295);
    });

    it('should produce 32-bit binary string', () => {
      expect(numberTo32BitBinary(0).length).toBe(32);
      expect(numberTo32BitBinary(255).length).toBe(32);
    });
  });
});
