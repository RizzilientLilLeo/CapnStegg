/**
 * Bit manipulation utilities for LSB steganography
 */

/**
 * Get the least significant bit from a byte
 */
export function getLSB(byte: number): number {
  return byte & 1;
}

/**
 * Set the least significant bit of a byte
 */
export function setLSB(byte: number, bit: number): number {
  return (byte & 0xFE) | (bit & 1);
}

/**
 * Convert a string to binary representation
 */
export function stringToBinary(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes)
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');
}

/**
 * Convert binary string to original string
 */
export function binaryToString(binary: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

/**
 * Convert a number to 32-bit binary string
 */
export function numberTo32BitBinary(num: number): string {
  return num.toString(2).padStart(32, '0');
}

/**
 * Convert 32-bit binary string to number
 */
export function binaryTo32BitNumber(binary: string): number {
  return parseInt(binary.slice(0, 32), 2);
}
