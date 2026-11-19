import { and, desc, eq, isNull, gt } from 'drizzle-orm';
import { db, schema } from '@/db';
import { sha256, sixDigits } from './crypto';
import { send } from './notify';

type Purpose = 'verify_email' | 'verify_phone' | 'login' | 'reset';
const WORDS: Record<Purpose, string> = { verify_email: 'confirm your email', verify_phone: 'confirm your phone', login: 'sign in', reset: 'reset your password' };
export const normalise = (t: string) => t.includes('@') ? t.trim().toLowerCase() : t.replace(/[^\d+]/g, '').replace(/^(?!\+)(267)?/, '+267');

export async function issueCode(target: string, purpose: Purpose) {
  const to = normalise(target);
  const [recent] = await db.select().from(schema.codes).where(and(eq(schema.codes.target, to), eq(schema.codes.purpose, purpose))).orderBy(desc(schema.codes.createdAt)).limit(1);
  if (recent && Date.now() - recent.createdAt.getTime() < 20_000) return { ok: false as const, error: 'A code was just sent. Wait a few seconds before asking again.' };
  const code = sixDigits();
  await db.insert(schema.codes).values({ target: to, purpose, codeHash: sha256(`${to}:${code}`), expiresAt: new Date(Date.now() + 10 * 60_000) });
  const msg = `Your CEDA code to ${WORDS[purpose]} is ${code}. It expires in 10 minutes. Never share it.`;
  await send(to.includes('@') ? 'email' : 'sms', to, to.includes('@') ? `Your CEDA code: ${code}` : null, msg);
  return { ok: true as const, to };
}

export async function useCode(target: string, purpose: Purpose, code: string) {
  const to = normalise(target);
  const [row] = await db.select().from(schema.codes).where(and(eq(schema.codes.target, to), eq(schema.codes.purpose, purpose), isNull(schema.codes.usedAt), gt(schema.codes.expiresAt, new Date()))).orderBy(desc(schema.codes.createdAt)).limit(1);
  if (!row) return { ok: false as const, error: 'That code has expired. Ask for a new one.' };
  if (row.attempts >= 5) return { ok: false as const, error: 'Too many wrong tries. Ask for a new code.' };
  if (row.codeHash !== sha256(`${to}:${code.trim()}`)) {
    await db.update(schema.codes).set({ attempts: row.attempts + 1 }).where(eq(schema.codes.id, row.id));
    return { ok: false as const, error: `That code is not right. ${4 - row.attempts} tries left.` };
  }
  await db.update(schema.codes).set({ usedAt: new Date() }).where(eq(schema.codes.id, row.id));
  return { ok: true as const, to };
}
