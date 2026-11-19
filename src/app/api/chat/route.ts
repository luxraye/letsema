import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { chatStatus } from '@/lib/hours';
import { currentUser } from '@/lib/session';
import { send } from '@/lib/notify';

export const dynamic = 'force-dynamic';

async function load(id: string) {
  const [chat] = await db.select().from(schema.chats).where(eq(schema.chats.id, id)).limit(1);
  if (!chat) return null;
  const msgs = await db.select({ id: schema.chatMessages.id, from: schema.chatMessages.from, body: schema.chatMessages.body, at: schema.chatMessages.createdAt }).from(schema.chatMessages).where(eq(schema.chatMessages.chatId, id)).orderBy(asc(schema.chatMessages.createdAt));
  let consultant: string | null = null;
  if (chat.consultantId) { const [c] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, chat.consultantId)); consultant = c?.name ?? null; }
  return { id: chat.id, status: chat.status, topic: chat.topic, consultant, messages: msgs };
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  const hours = chatStatus();
  const online = hours.open ? await db.$count(schema.users, eq(schema.users.role, 'consultant')) : 0;
  return NextResponse.json({ hours, consultants: online, chat: id ? await load(id) : null });
}

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), topic: z.string().max(40), body: z.string().min(1).max(2000), name: z.string().max(80).optional(), contact: z.string().max(120).optional() }),
  z.object({ action: z.literal('send'), id: z.string().uuid(), body: z.string().min(1).max(2000) }),
  z.object({ action: z.literal('rate'), id: z.string().uuid(), rating: z.number().int().min(1).max(5) }),
]);

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  const me = await currentUser();
  const b = parsed.data;
  if (b.action === 'start') {
    const hours = chatStatus();
    const [chat] = await db.insert(schema.chats).values({ userId: me?.id ?? null, guestName: me ? null : b.name || 'Guest', guestContact: me ? me.email : b.contact || null, topic: b.topic, status: hours.open ? 'waiting' : 'offline' }).returning();
    await db.insert(schema.chatMessages).values({ chatId: chat.id, from: 'user', authorId: me?.id, body: b.body });
    if (!hours.open) {
      await db.insert(schema.chatMessages).values({ chatId: chat.id, from: 'system', body: `Our consultants are not available right now (${hours.reason.toLowerCase()}). Live chat runs Monday to Friday, 09:00 to 16:00, except public holidays. Your message is saved and a consultant will reply by email on the next working day.` });
      const to = me?.email ?? b.contact;
      if (to) await send(to.includes('@') ? 'email' : 'sms', to, 'We received your message', 'Thank you for contacting CEDA. A consultant will reply on the next working day.');
    } else {
      await db.insert(schema.chatMessages).values({ chatId: chat.id, from: 'system', body: 'Thanks! A consultant will join in a moment.' });
    }
    return NextResponse.json({ chat: await load(chat.id) });
  }
  const [chat] = await db.select().from(schema.chats).where(eq(schema.chats.id, b.id)).limit(1);
  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  if (b.action === 'rate') { await db.update(schema.chats).set({ rating: b.rating }).where(eq(schema.chats.id, b.id)); return NextResponse.json({ ok: true }); }
  if (chat.status === 'closed') return NextResponse.json({ error: 'This chat has ended' }, { status: 409 });
  await db.insert(schema.chatMessages).values({ chatId: b.id, from: 'user', authorId: me?.id, body: b.body });
  return NextResponse.json({ chat: await load(b.id) });
}
