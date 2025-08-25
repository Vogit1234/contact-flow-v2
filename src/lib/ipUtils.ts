// IP address utility functions for access control

export interface IPRange {
  id: string;
  range: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
}

// Function to get user's IP address
export const getUserIP = async (): Promise<string> => {
  try {
    // Try multiple IP detection services for reliability
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://jsonip.com'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        const data = await response.json();
        
        // Different services return IP in different formats
        const ip = data.ip || data.query || data.IPv4;
        if (ip) {
          return ip;
        }
      } catch (error) {
        console.warn(`Failed to get IP from ${service}:`, error);
        continue;
      }
    }

    // Fallback: try to get IP from a different approach
    const response = await fetch('https://checkip.amazonaws.com/');
    const ip = (await response.text()).trim();
    return ip;
  } catch (error) {
    console.error('Failed to get user IP address:', error);
    // Return localhost as fallback for development
    return '127.0.0.1';
  }
};

// Function to check if an IP is within a CIDR range
export const isIPInCIDR = (ip: string, cidr: string): boolean => {
  if (!ip || !cidr) return false;

  // Handle single IP addresses (no CIDR notation)
  if (!cidr.includes('/')) {
    return ip === cidr;
  }

  try {
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);

    if (prefix < 0 || prefix > 32) {
      return false;
    }

    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;

    return (ipNum & mask) === (networkNum & mask);
  } catch (error) {
    console.error('Error checking IP in CIDR:', error);
    return false;
  }
};

// Convert IP address to number for comparison
const ipToNumber = (ip: string): number => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

// Function to validate IP address format
export const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

// Function to validate CIDR notation
export const isValidCIDR = (cidr: string): boolean => {
  if (!cidr.includes('/')) {
    return isValidIP(cidr);
  }

  const [ip, prefix] = cidr.split('/');
  const prefixNum = parseInt(prefix, 10);

  return isValidIP(ip) && prefixNum >= 0 && prefixNum <= 32;
};

// Function to check if user IP is allowed
export const isIPAllowed = (userIP: string, allowedRanges: string[]): boolean => {
  if (!userIP || allowedRanges.length === 0) {
    return false;
  }

  // Check against each allowed range
  for (const range of allowedRanges) {
    const trimmedRange = range.trim();
    if (trimmedRange && isIPInCIDR(userIP, trimmedRange)) {
      return true;
    }
  }

  return false;
};

// Function to parse IP ranges from text input
export const parseIPRanges = (ipText: string): string[] => {
  return ipText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // Remove empty lines and comments
    .filter(line => isValidCIDR(line)); // Only keep valid IP/CIDR entries
};

// Function to check if user should be restricted
export const shouldRestrictAccess = async (userRole: string, allowedRanges: string[]): Promise<boolean> => {
  // Admin users are never restricted
  if (userRole === 'Admin') {
    return false;
  }

  // If no IP ranges are configured, don't restrict
  if (!allowedRanges || allowedRanges.length === 0) {
    return false;
  }

  try {
    const userIP = await getUserIP();
    console.log('User IP:', userIP, 'Allowed ranges:', allowedRanges);
    
    return !isIPAllowed(userIP, allowedRanges);
  } catch (error) {
    console.error('Error checking IP restrictions:', error);
    // In case of error, allow access to prevent lockout
    return false;
  }
};