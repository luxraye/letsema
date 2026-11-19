'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { appendAudit } from '@/lib/audit';
import { requireUser } from '@/lib/session';
import { notify } from '@/lib/notify';
import { normalise } from '@/lib/codes';

export type CState = { error?: string; ok?: string } | undefined;

export async function updateProfile(_: CState, fd: FormData): Promise<CState> {
  const me = await requireUser();
  const s = (k: string, n = 120) => { const v = String(fd.get(k) ?? '').trim(); return v ? v.slice(0, n) : null; };
  const phone = s('phone') ? normalise(s('phone')!) : null;
  if (phone && !/^\+267[2-9]\d{6,7}$/.test(phone)) return { error: 'Enter a Botswana mobile number.' };
  const omang = s('omang', 12);
  if (omang && !/^\d{9}$/.test(omang)) return { error: 'Omang numbers have 9 digits.' };
  const ys = fd.get('youthShare') ? Number(fd.get('youthShare')) : null;
  await db.update(schema.users).set({ name: s('name', 80) ?? me.name, phone, phoneVerifiedAt: phone === me.phone ? me.phoneVerifiedAt : null, district: s('district'), dateOfBirth: s('dateOfBirth', 10), gender: s('gender', 20), omang, organisation: s('organisation'), cipaNumber: s('cipaNumber', 20), youthShare: ys != null && ys >= 0 && ys <= 100 ? ys : null }).where(eq(schema.users.id, me.id));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'user.profile_updated' });
  revalidatePath('/dashboard/profile');
  return { ok: 'Profile saved.' };
}

export async function updateAlerts(fd: FormData) {
  const me = await requireUser();
  await db.update(schema.users).set({ alerts: { email: fd.get('email') === 'on', sms: fd.get('sms') === 'on', inapp: fd.get('inapp') === 'on' } }).where(eq(schema.users.id, me.id));
  revalidatePath('/dashboard/profile');
}

export async function removePasskey(id: string) {
  const me = await requireUser();
  await db.delete(schema.passkeys).where(and(eq(schema.passkeys.id, id), eq(schema.passkeys.userId, me.id)));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'auth.passkey_removed' });
  revalidatePath('/dashboard/profile');
}

export async function signOutEverywhere() {
  const me = await requireUser();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, me.id));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'auth.signed_out_everywhere' });
  redirect('/login');
}

/** Data Protection Act 2024: people can ask for a copy, a correction or erasure. CEDA answers within 30 days. */
export async function requestPrivacy(fd: FormData) {
  const me = await requireUser();
  const kind = String(fd.get('kind')) as 'export' | 'erase' | 'correct';
  if (!['export', 'erase', 'correct'].includes(kind)) return;
  await db.insert(schema.privacyRequests).values({ userId: me.id, kind, note: String(fd.get('note') ?? '').slice(0, 1000), dueAt: new Date(Date.now() + 30 * 86400_000) });
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'privacy.requested', detail: { kind } });
  const admins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, 'admin'));
  for (const a of admins) await notify(a.id, 'New data protection request', `${kind} request. Due within 30 days.`, '/dashboard/privacy');
  revalidatePath('/dashboard/profile');
}

export async function resolvePrivacy(id: string, fd: FormData) {
  const me = await requireUser({ perm: 'privacy.manage' });
  const [r] = await db.select().from(schema.privacyRequests).where(eq(schema.privacyRequests.id, id));
  if (!r || r.status !== 'open' || !r.userId) return;
  const outcome = String(fd.get('outcome')) === 'refuse' ? 'refused' : 'done';
  if (outcome === 'done' && r.kind === 'erase') {
    // Pseudonymise: keep anonymous records the law requires (funding decisions, audit), remove who the person is.
    await db.update(schema.users).set({ name: 'Erased user', email: `erased-${r.userId}@invalid`, phone: null, omang: null, dateOfBirth: null, gender: null, organisation: null, cipaNumber: null, passwordHash: '!', erasedAt: new Date(), alerts: { email: false, sms: false, inapp: false } }).where(eq(schema.users.id, r.userId));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, r.userId));
    await db.delete(schema.passkeys).where(eq(schema.passkeys.userId, r.userId));
    await db.update(schema.subscriptions).set({ active: false }).where(eq(schema.subscriptions.userId, r.userId));
    const entries = await db.select().from(schema.entries).where(eq(schema.entries.innovatorId, r.userId));
    for (const e of entries) await db.update(schema.entries).set({ team: e.team.map((m, i) => ({ name: `Member ${i + 1}`, email: '', lead: m.lead, share: m.share })) }).where(eq(schema.entries.id, e.id));
  }
  await db.update(schema.privacyRequests).set({ status: outcome, resolvedAt: new Date(), note: `${r.note}${fd.get('reply') ? `\n\nReply: ${String(fd.get('reply')).slice(0, 1000)}` : ''}` }).where(eq(schema.privacyRequests.id, id));
  await appendAudit({ actorId: me.id, actorName: me.name, action: `privacy.${outcome}`, detail: { kind: r.kind, request: id } });
  if (r.kind !== 'erase' || outcome === 'refused') await notify(r.userId, 'Your data protection request', outcome === 'done' ? 'We have completed your request.' : `We could not complete it: ${String(fd.get('reply') ?? '')}`, '/dashboard/profile');
  revalidatePath('/dashboard/privacy');
}
