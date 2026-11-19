import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';

export const demoMode = () => process.env.DEMO_MODE !== '0';

/** Send an email or SMS. In demo mode, messages land in the demo inbox so judges need no real address. */
export async function send(channel: 'email' | 'sms', to: string, subject: string | null, body: string) {
  await db.insert(schema.outbox).values({ channel, to, subject, body });
  // Production: hand off to the configured provider here (e.g. SMTP relay, BTC/Mascom SMS gateway).
}

/** Tell a user something, on every channel they switched on. */
export async function notify(userId: string, title: string, body: string, link?: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!u) return;
  if (u.alerts.inapp) await db.insert(schema.notifications).values({ userId, title, body, link });
  if (u.alerts.email) await send('email', u.email, title, `${body}${link ? `\n\nOpen: ${link}` : ''}`);
  if (u.alerts.sms && u.phone) await send('sms', u.phone, null, `CEDA: ${title}. ${body}`.slice(0, 300));
}

/** Free alerts: everyone following an entry (signed in or not) hears about status changes. */
export async function alertFollowers(entryId: string, ref: string, title: string, body: string) {
  const subs = await db.select().from(schema.subscriptions).where(and(eq(schema.subscriptions.entryId, entryId), eq(schema.subscriptions.active, true)));
  for (const s of subs) {
    const unsub = `/alerts/stop/${s.token}`;
    await send(s.channel, s.contact, s.channel === 'email' ? `${ref}: ${title}` : null, s.channel === 'email' ? `${body}\n\nTrack it: /track?ref=${ref}\nStop these alerts: ${unsub}` : `CEDA ${ref}: ${title}. ${body}`.slice(0, 300));
  }
}

export async function notifyMany(userIds: string[], title: string, body: string, link?: string) {
  const uniq = [...new Set(userIds)];
  if (!uniq.length) return;
  const rows = await db.select({ id: schema.users.id }).from(schema.users).where(inArray(schema.users.id, uniq));
  for (const r of rows) await notify(r.id, title, body, link);
}
