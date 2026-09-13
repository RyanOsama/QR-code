import crypto from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 without ambiguous characters (0, 1, I, O)

/**
 * Generates a cryptographically secure, random, unguessable token
 * Example format: INV-8F92A7XK29
 */
export function generateSecureToken(prefix: string = 'INV'): string {
  const bytes = crypto.randomBytes(8);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${result}`;
}
