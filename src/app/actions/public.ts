'use server';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { normalise } from '@/lib/codes';
import { send } from '@/lib/notify';
import { currentUser } from '@/lib/session';
import { appendAudit } from '@/lib/audit';
import { slaTargets, type Severity, SLA } from '@/lib/sla';
import { fmtDateTime } from '@/lib/format';

export type PState = { error?: string; ok?: string } | undefined;

/** Free alerts for any reference, no account needed. */
export async function followEntry(_: PState, fd: FormData): Promise<PState> {
  const ref = String(fd.get('ref') ?? '').trim().toUpperCase();
  const contact = String(fd.get('contact') ?? '').trim();
  if (!contact) return { error: 'Enter an email or mobile number.' };
  const to = normalise(contact);
  const channel = to.includes('@') ? 'email' as const : 'sms' as const;
  if (channel === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { error: 'That email does not look right.' };
  if (channel === 'sms' && !/^\+267[2-9]\d{6,7}$/.test(to)) return { error: 'Enter a Botswana mobile number.' };
  const [e] = await db.select().from(schema.entries).where(eq(schema.entries.ref, ref)).limit(1);
  if (!e || e.status === 'draft') return { error: 'No submitted application has that reference.' };
  const [dup] = await db.select().from(schema.subscriptions).where(and(eq(schema.subscriptions.entryId, e.id), eq(schema.subscriptions.contact, to), eq(schema.subscriptions.active, true))).limit(1);
  if (dup) return { ok: `${to} already gets alerts for ${ref}.` };
  const me = await currentUser();
  const [s] = await db.insert(schema.subscriptions).values({ userId: me?.id ?? null, contact: to, channel, entryId: e.id }).returning();
  await send(channel, to, channel === 'email' ? `You are following ${ref}` : null, `You will get a free ${channel === 'email' ? 'email' : 'SMS'} each time ${ref} moves to a new step. Stop any time: /alerts/stop/${s.token}`);
  return { ok: `Done. ${to} will get a free ${channel === 'email' ? 'email' : 'SMS'} at every step.` };
}

export async function stopAlerts(token: string) {
  await db.update(schema.subscriptions).set({ active: false }).where(eq(schema.subscriptions.token, token));
}

export async function openTicket(_: PState, fd: FormData): Promise<PState> {
  const me = await currentUser();
  const name = String(fd.get('name') ?? me?.name ?? '').trim();
  const contact = String(fd.get('contact') ?? me?.email ?? '').trim();
  const severity = String(fd.get('severity') ?? 'P3') as Severity;
  const subject = String(fd.get('subject') ?? '').trim(); const body = String(fd.get('body') ?? '').trim();
  if (!name || !contact || !subject || !body) return { error: 'Please fill in every field.' };
  if (!SLA[severity]) return { error: 'Choose how serious it is.' };
  const ref = `SUP-${Math.floor(1000 + Math.random() * 9000)}${Date.now() % 100}`;
  const t = slaTargets(severity);
  await db.insert(schema.tickets).values({ ref, userId: me?.id ?? null, name: name.slice(0, 80), contact: contact.slice(0, 120), severity, category: String(fd.get('category') ?? 'Portal').slice(0, 40), subject: subject.slice(0, 140), body: body.slice(0, 4000), ...t });
  await appendAudit({ actorId: me?.id, actorName: me?.name ?? name, action: 'support.ticket_opened', detail: { ref, severity } });
  if (contact.includes('@') || /\d{7}/.test(contact)) await send(contact.includes('@') ? 'email' : 'sms', normalise(contact), `We received your report ${ref}`, `Thank you. Your reference is ${ref}. We will respond by ${fmtDateTime(t.respondBy)} and aim to fix it by ${fmtDateTime(t.resolveBy)}.`);
  return { ok: `Reported. Your reference is ${ref}. We will respond by ${fmtDateTime(t.respondBy)} and aim to resolve it by ${fmtDateTime(t.resolveBy)}.` };
}
