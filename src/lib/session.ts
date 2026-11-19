import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { Role } from '@/db/schema';
import { sha256, token } from './crypto';
import { can, type Permission } from './rbac';

export const COOKIE = 'ceda_session';
const DAYS = 7;

export async function startSession(userId: string, method: string) {
  const raw = token();
  const ua = (await headers()).get('user-agent')?.slice(0, 200) ?? null;
  await db.insert(schema.sessions).values({ id: sha256(raw), userId, method, userAgent: ua, expiresAt: new Date(Date.now() + DAYS * 86400_000) });
  (await cookies()).set(COOKIE, raw, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}

export async function endSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(raw)));
  jar.delete(COOKIE);
}

export type Me = typeof schema.users.$inferSelect;

export const currentUser = cache(async (): Promise<Me | null> => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [row] = await db.select({ u: schema.users }).from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(raw)), gt(schema.sessions.expiresAt, new Date()))).limit(1);
  return row && !row.u.erasedAt ? row.u : null;
});

export async function requireUser(opts?: { perm?: Permission; roles?: Role[] }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (opts?.perm && !can(me.role, opts.perm)) redirect('/dashboard?denied=1');
  if (opts?.roles && !opts.roles.includes(me.role)) redirect('/dashboard?denied=1');
  return me;
}

export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}
