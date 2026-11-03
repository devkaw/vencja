import { createHash, randomBytes } from 'crypto';

export const TOKEN_TTL_MS = 60 * 60 * 1000;
export const MAX_TOKENS_PER_HOUR = 3;

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Only the hash is stored in auth_tokens, so a leaked row can't be used as a link.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
