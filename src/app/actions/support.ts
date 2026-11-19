'use server';
import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { appendAudit } from '@/lib/audit';
import { send, notify } from '@/lib/notify';

/** A consultant picks up a waiting chat. Only one consultant can hold a chat. */
export async function claimChat(chatId: string) {
  const me = await requireUser({ perm: 'chat.answer' });
  const [c] = await db.update(schema.chats).set({ consultantId: me.id, status: 'active' })
    .where(and(eq(schema.chats.id, chatId), isNull(schema.chats.consultantId))).returning();
  if (c) await db.insert(schema.chatMessages).values({ chatId, from: 'system', body: `${me.name} from CEDA joined the chat.` });
  revalidatePath('/dashboard/chat');
}

export async function replyChat(chatId: string, fd: FormData) {
  const me = await requireUser({ perm: 'chat.answer' });
  const body = String(fd.get('body') ?? '').trim().slice(0, 2000);
  if (!body) return;
  const [c] = await db.select().from(schema.chats).where(eq(schema.chats.id, chatId)).limit(1);
  if (!c || c.status === 'closed') return;
  if (c.consultantId && c.consultantId !== me.id && me.role === 'consultant') return;
  await db.insert(schema.chatMessages).values({ chatId, from: 'consultant', authorId: me.id, body });
  await db.update(schema.chats).set({ consultantId: c.consultantId ?? me.id, status: c.status === 'offline' ? 'offline' : 'active', firstReplyAt: c.firstReplyAt ?? new Date() }).where(eq(schema.chats.id, chatId));
  // Offline messages are answered by email or SMS, since the person is no longer on the page.
  if (c.status === 'offline') {
    const to = c.guestContact ?? (c.userId ? (await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, c.userId)))[0]?.email : null);
    if (to) await send(to.includes('@') ? 'email' : 'sms', to, 'A reply from CEDA', body);
    if (c.userId) await notify(c.userId, 'A consultant replied to your message', body.slice(0, 140), '/dashboard');
    await db.update(schema.chats).set({ status: 'closed', closedAt: new Date() }).where(eq(schema.chats.id, chatId));
  }
  revalidatePath('/dashboard/chat');
}

export async function closeChat(chatId: string) {
  const me = await requireUser({ perm: 'chat.answer' });
  await db.update(schema.chats).set({ status: 'closed', closedAt: new Date() }).where(eq(schema.chats.id, chatId));
  await db.insert(schema.chatMessages).values({ chatId, from: 'system', body: `${me.name} ended the chat. You can rate it below.` });
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'chat.closed', detail: { chatId } });
  revalidatePath('/dashboard/chat');
}

export async function updateTicket(ticketId: string, fd: FormData) {
  const me = await requireUser({ perm: 'chat.answer' });
  const status = String(fd.get('status') ?? '') as 'open' | 'in_progress' | 'resolved';
  if (!['open', 'in_progress', 'resolved'].includes(status)) return;
  const note = String(fd.get('note') ?? '').trim().slice(0, 2000);
  const [t] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
  if (!t) return;
  const now = new Date();
  await db.update(schema.tickets).set({
    status,
    firstResponseAt: t.firstResponseAt ?? (status !== 'open' || note ? now : null),
    resolvedAt: status === 'resolved' ? (t.resolvedAt ?? now) : null,
    resolution: note || t.resolution,
  }).where(eq(schema.tickets.id, ticketId));
  if (note && t.contact) await send(t.contact.includes('@') ? 'email' : 'sms', t.contact, `Update on ${t.ref}`, note);
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'support.ticket_updated', detail: { ref: t.ref, status } });
  revalidatePath('/dashboard/support');
}
