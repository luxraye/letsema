import { createHash, randomBytes, randomInt, createHmac, timingSafeEqual } from 'node:crypto';

export const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
export const token = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sixDigits = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

/** JSON with keys sorted at every level, so the same rules always give the same hash. */
export function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(',')}}`;
}

const secret = () => process.env.SESSION_SECRET ?? 'dev-only-secret';
export const hmac = (s: string) => createHmac('sha256', secret()).update(s).digest('hex');
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Short human-readable verification code for awards and receipts, e.g. 7KQ2-MX4P. */
export function shortCode(input: string) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const h = Buffer.from(hmac(input), 'hex');
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[h[i] % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}
