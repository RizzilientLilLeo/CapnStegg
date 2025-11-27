import crypto from 'crypto';

/**
 * Hashes an IP address using SHA-256 for privacy
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Extracts IP address from request, handling proxies
 */
export function extractIP(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  // Check X-Forwarded-For header (from proxies)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0];
    return ips.trim();
  }

  // Check X-Real-IP header (from Nginx)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  // Fall back to direct connection IP
  return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}

/**
 * Validates if a string is a valid IP address
 */
export function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  // IPv4-mapped IPv6
  const mappedPattern = /^::ffff:(\d{1,3}\.){3}\d{1,3}$/;

  if (ipv4Pattern.test(ip)) {
    const octets = ip.split('.').map(Number);
    return octets.every(o => o >= 0 && o <= 255);
  }

  return ipv6Pattern.test(ip) || mappedPattern.test(ip) || ip === '::1';
}

/**
 * Anonymizes an IP address by keeping only the network portion
 */
export function anonymizeIP(ip: string): string {
  // For IPv4, keep first 3 octets
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  // For IPv6, keep first 4 groups
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  }
  return ip;
}
