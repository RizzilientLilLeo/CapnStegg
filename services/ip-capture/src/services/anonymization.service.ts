import crypto from 'crypto';

/**
 * Hash an IP address using SHA-256 for anonymization
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Truncate an IP address for partial anonymization
 * IPv4: Keep first 3 octets (e.g., 192.168.1.x)
 * IPv6: Keep first 3 groups
 */
export function truncateIP(ip: string): string {
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + ':x:x:x:x:x';
  } else {
    // IPv4
    const parts = ip.split('.');
    return parts.slice(0, 3).join('.') + '.x';
  }
}

/**
 * Validate an IP address format
 */
export function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Parts = ip.split('.');
  if (ipv4Parts.length === 4) {
    const isValidIPv4 = ipv4Parts.every(part => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
    });
    if (isValidIPv4) return true;
  }
  
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$/;
  
  return ipv6Pattern.test(ip);
}

/**
 * Extract IP address from request headers
 */
export function extractIP(
  remoteAddress: string | undefined,
  xForwardedFor: string | undefined
): string {
  // Check X-Forwarded-For header first (for proxied requests)
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }
  
  // Fall back to remote address
  if (remoteAddress) {
    // Remove IPv6 prefix if present
    const cleanIP = remoteAddress.replace(/^::ffff:/, '');
    return cleanIP;
  }
  
  return 'unknown';
}
