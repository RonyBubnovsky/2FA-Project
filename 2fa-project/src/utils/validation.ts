// Production-ready email validation regex
export const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

/**
 * Validates an email address according to RFC 5322 standards
 * with additional ICANN rule enforcement
 * @param email The email address to validate
 * @returns boolean indicating if email is valid
 */
export function validateEmail(email: string): boolean {
  // Basic regex check
  if (!emailRegex.test(email)) return false;
  
  // RFC 5322 length limits
  if (email.length > 254) return false;
  
  const [local, domain] = email.split('@');
  if (local.length > 64) return false;
  if (domain.length > 253) return false;
  
  // Additional checks
  if (email.includes('..')) return false; // No consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;
  
  // ICANN rules enforcement
  const tld = domain.split('.').pop() || '';
  if (tld.length < 2) return false;  // TLD must be at least 2 characters
  
  return true;
} 