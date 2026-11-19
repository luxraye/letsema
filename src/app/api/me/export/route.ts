import { eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { currentUser } from '@/lib/session';
import { appendAudit } from '@/lib/audit';

/** Download everything we hold about you, as JSON (right of access). */
export async function GET() {
  const me = await currentUser();
  if (!me) return new Response('Sign in first', { status: 401 });
  const entries = await db.select().from(schema.entries).where(eq(schema.entries.innovatorId, me.id));
  const ids = entries.map((e) => e.id);
  const [messages, notifications, subs, chats] = await Promise.all([
    ids.length ? db.select().from(schema.messages).where(inArray(schema.messages.entryId, ids)) : [],
    db.select().from(schema.notifications).where(eq(schema.notifications.userId, me.id)),
    db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, me.id)),
    db.select().from(schema.chats).where(eq(schema.chats.userId, me.id)),
  ]);
  const { passwordHash: _p, ...profile } = me;
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'privacy.exported' });
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), profile, applications: entries, messages: messages.filter((m) => !m.internal), notifications, alertSubscriptions: subs, chats }, null, 2);
  return new Response(body, { headers: { 'content-type': 'application/json', 'content-disposition': 'attachment; filename="my-ceda-data.json"' } });
}
