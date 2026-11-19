'use server';
import { redirect } from 'next/navigation';
import { eq, or } from 'drizzle-orm';
import { db, schema } from '@/db';
import { appendAudit } from '@/lib/audit';
import { issueCode, normalise, useCode } from '@/lib/codes';
import { checkPassword, hashPassword, passwordProblem } from '@/lib/password';
import { clientIp, currentUser, endSession, startSession } from '@/lib/session';
import { demoMode } from '@/lib/notify';

export type FormState = { error?: string; ok?: string; step?: string; target?: string } | undefined;
const LOCK_AFTER = 5; const LOCK_MIN = 15;

async function findByContact(contact: string) {
  const c = normalise(contact);
  const [u] = await db.select().from(schema.users).where(or(eq(schema.users.email, c), eq(schema.users.phone, c))).limit(1);
  return u && !u.erasedAt ? u : null;
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const contact = String(fd.get('email') ?? ''); const password = String(fd.get('password') ?? '');
  const next = safeNext(fd.get('next'));
  const u = await findByContact(contact);
  const ip = await clientIp();
  if (!u) { await checkPassword(password, '$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv'); return { error: 'Email or password is not right.' }; }
  if (u.lockedUntil && u.lockedUntil > new Date()) return { error: `Too many wrong tries. Try again after ${u.lockedUntil.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Gaborone' })}, or sign in with a code.` };
  if (!(await checkPassword(password, u.passwordHash))) {
    const fails = u.failedLogins + 1;
    const lock = fails >= LOCK_AFTER ? new Date(Date.now() + LOCK_MIN * 60_000) : null;
    await db.update(schema.users).set({ failedLogins: lock ? 0 : fails, lockedUntil: lock }).where(eq(schema.users.id, u.id));
    await appendAudit({ actorId: u.id, actorName: u.name, action: lock ? 'auth.locked' : 'auth.failed', detail: { fails }, ip });
    return { error: lock ? `Account locked for ${LOCK_MIN} minutes after ${LOCK_AFTER} wrong tries.` : `Email or password is not right. ${LOCK_AFTER - fails} tries left before a short lock.` };
  }
  if (!u.emailVerifiedAt) { await issueCode(u.email, 'verify_email'); redirect(`/verify-account?email=${encodeURIComponent(u.email)}`); }
  await db.update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, u.id));
  await startSession(u.id, 'password');
  await appendAudit({ actorId: u.id, actorName: u.name, action: 'auth.signin', detail: { method: 'password' }, ip });
  redirect(next);
}

export async function demoLogin(email: string, next = '/dashboard') {
  if (!demoMode()) throw new Error('Demo sign-in is off');
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!u) throw new Error('No such demo account');
  await endSession();
  await startSession(u.id, 'demo');
  await appendAudit({ actorId: u.id, actorName: u.name, action: 'auth.signin', detail: { method: 'demo' }, ip: await clientIp() });
  redirect(safeNext(next));
}

export async function sendLoginCode(_: FormState, fd: FormData): Promise<FormState> {
  const contact = String(fd.get('contact') ?? '').trim();
  if (!contact) return { error: 'Enter your email or phone number.' };
  const u = await findByContact(contact);
  // Same answer whether or not the account exists, so the form cannot be used to find accounts.
  if (u) { const r = await issueCode(contact, 'login'); if (!r.ok) return { error: r.error }; }
  return { step: 'code', target: contact, ok: `If an account uses ${contact}, a 6-digit code is on its way.` };
}

export async function verifyLoginCode(_: FormState, fd: FormData): Promise<FormState> {
  const contact = String(fd.get('contact') ?? ''); const code = String(fd.get('code') ?? '');
  const r = await useCode(contact, 'login', code);
  if (!r.ok) return { step: 'code', target: contact, error: r.error };
  const u = await findByContact(contact);
  if (!u) return { error: 'Account not found.' };
  if (contact.includes('@') && !u.emailVerifiedAt) await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, u.id));
  await startSession(u.id, 'code');
  await appendAudit({ actorId: u.id, actorName: u.name, action: 'auth.signin', detail: { method: contact.includes('@') ? 'email code' : 'SMS code' }, ip: await clientIp() });
  redirect(safeNext(fd.get('next')));
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const phoneRaw = String(fd.get('phone') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  if (name.length < 3) return { error: 'Enter your full name.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid email address.' };
  const phone = phoneRaw ? normalise(phoneRaw) : null;
  if (phone && !/^\+267[2-9]\d{6,7}$/.test(phone)) return { error: 'Enter a Botswana mobile number, e.g. 71 234 567.' };
  const pw = passwordProblem(password); if (pw) return { error: pw };
  if (password !== String(fd.get('confirm') ?? '')) return { error: 'The two passwords do not match.' };
  if (fd.get('consent') !== 'on') return { error: 'Please agree to the privacy notice to continue.' };
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(or(eq(schema.users.email, email), phone ? eq(schema.users.phone, phone) : eq(schema.users.email, email))).limit(1);
  if (exists) return { error: 'An account already uses that email or phone. Sign in, or use “Forgot password”.' };
  const [u] = await db.insert(schema.users).values({ name, email, phone, passwordHash: await hashPassword(password), role: 'innovator', consentAt: new Date(), alerts: { email: true, sms: !!phone, inapp: true } }).returning();
  await issueCode(email, 'verify_email');
  if (phone) await issueCode(phone, 'verify_phone');
  await appendAudit({ actorId: u.id, actorName: u.name, action: 'user.registered', detail: { phone: !!phone, consent: 'privacy notice v1' }, ip: await clientIp() });
  redirect(`/verify-account?email=${encodeURIComponent(email)}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`);
}

export async function verifyAccount(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get('email') ?? ''); const phone = String(fd.get('phone') ?? '');
  const r = await useCode(email, 'verify_email', String(fd.get('emailCode') ?? ''));
  if (!r.ok) return { error: `Email code: ${r.error}` };
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, normalise(email))).limit(1);
  if (!u) return { error: 'Account not found.' };
  const set: Partial<typeof schema.users.$inferInsert> = { emailVerifiedAt: new Date() };
  if (phone) {
    const p = await useCode(phone, 'verify_phone', String(fd.get('phoneCode') ?? ''));
    if (!p.ok) { await db.update(schema.users).set(set).where(eq(schema.users.id, u.id)); return { error: `Email confirmed. Phone code: ${p.error}` }; }
    set.phoneVerifiedAt = new Date();
  }
  await db.update(schema.users).set(set).where(eq(schema.users.id, u.id));
  await startSession(u.id, 'registration');
  await appendAudit({ actorId: u.id, actorName: u.name, action: 'user.verified', detail: { email: true, phone: !!set.phoneVerifiedAt } });
  redirect('/dashboard?welcome=1');
}

export async function resendCode(target: string, purpose: 'verify_email' | 'verify_phone') {
  const r = await issueCode(target, purpose);
  return r.ok ? { ok: 'New code sent.' } : { error: r.error };
}

export async function forgot(_: FormState, fd: FormData): Promise<FormState> {
  const contact = String(fd.get('contact') ?? '').trim();
  if (!contact) return { error: 'Enter your email or phone.' };
  const u = await findByContact(contact);
  if (u) { const r = await issueCode(contact, 'reset'); if (!r.ok) return { error: r.error }; await appendAudit({ actorId: u.id, actorName: u.name, action: 'auth.reset_requested', ip: await clientIp() }); }
  return { step: 'code', target: contact, ok: `If an account uses ${contact}, we sent a reset code.` };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const contact = String(fd.get('contact') ?? ''); const password = String(fd.get('password') ?? '');
  const pw = passwordProblem(password); if (pw) return { step: 'code', target: contact, error: pw };
  const r = await useCode(contact, 'reset', String(fd.get('code') ?? ''));
  if (!r.ok) return { step: 'code', target: contact, error: r.error };
  const u = await findByContact(contact);
  if (!u) return { error: 'Account not found.' };
  await db.update(schema.users).set({ passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, u.id));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, u.id));
  await appendAudit({ actorId: u.id, actorName: u.name, action: 'auth.password_reset', detail: { signedOutEverywhere: true }, ip: await clientIp() });
  redirect('/login?reset=1');
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await currentUser(); if (!me) redirect('/login');
  if (!(await checkPassword(String(fd.get('current') ?? ''), me.passwordHash))) return { error: 'Your current password is not right.' };
  const next = String(fd.get('password') ?? '');
  const pw = passwordProblem(next); if (pw) return { error: pw };
  if (next !== String(fd.get('confirm') ?? '')) return { error: 'The two new passwords do not match.' };
  await db.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, me.id));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'auth.password_changed' });
  return { ok: 'Password changed.' };
}

export async function logout() {
  const me = await currentUser();
  if (me) await appendAudit({ actorId: me.id, actorName: me.name, action: 'auth.signout' });
  await endSession();
  redirect('/');
}

function safeNext(v: FormDataEntryValue | null | string) {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/dashboard';
}
