import 'server-only';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@/db';
import { sha256 } from './crypto';

/** Partner API keys: `Authorization: Bearer ceda_live_…`. Only the key's fingerprint is stored. */
export async function apiKey(req: Request) {
  const raw = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!raw?.startsWith('ceda_live_')) return null;
  const [k] = await db.select().from(schema.apiKeys).where(and(eq(schema.apiKeys.keyHash, sha256(raw)), isNull(schema.apiKeys.revokedAt))).limit(1);
  if (!k) return null;
  await db.update(schema.apiKeys).set({ lastUsedAt: new Date() }).where(eq(schema.apiKeys.id, k.id));
  return k;
}

export const unauthorised = () => Response.json({ error: 'Send a valid API key as: Authorization: Bearer ceda_live_…' }, { status: 401, headers: { 'www-authenticate': 'Bearer' } });
