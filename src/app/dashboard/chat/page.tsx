import Link from 'next/link';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { chatStatus } from '@/lib/hours';
import { PageHeader, Stat, Empty, Badge, Notice } from '@/components/ui';
import { Submit } from '@/components/forms';
import { Live } from '@/components/live';
import { ago, fmtDateTime } from '@/lib/format';
import { claimChat, closeChat, replyChat } from '@/app/actions/support';

export const dynamic = 'force-dynamic';

const TONE = { waiting: 'amber', active: 'green', offline: 'blue', closed: 'gray' } as const;

export default async function ChatConsole({ searchParams }: { searchParams: Promise<{ id?: string; view?: string }> }) {
  const me = await requireUser({ perm: 'chat.answer' });
  const sp = await searchParams;
  const view = sp.view === 'closed' ? 'closed' : 'open';
  const hours = chatStatus();
  const list = await db.select({ c: schema.chats, who: schema.users.name }).from(schema.chats).leftJoin(schema.users, eq(schema.users.id, schema.chats.userId))
    .where(view === 'closed' ? eq(schema.chats.status, 'closed') : inArray(schema.chats.status, ['waiting', 'active', 'offline']))
    .orderBy(view === 'closed' ? desc(schema.chats.createdAt) : asc(schema.chats.createdAt)).limit(60);
  const [stats] = await db.select({
    total: sql<number>`count(*)::int`,
    rated: sql<number>`count(${schema.chats.rating})::int`,
    rating: sql<number>`coalesce(round(avg(${schema.chats.rating})::numeric, 1), 0)::float`,
    wait: sql<number>`coalesce(round(avg(extract(epoch from (${schema.chats.firstReplyAt} - ${schema.chats.createdAt})) / 60)::numeric, 1), 0)::float`,
    offline: sql<number>`count(*) filter (where ${schema.chats.status} = 'offline')::int`,
  }).from(schema.chats);
  const openId = sp.id ?? list[0]?.c.id;
  const current = openId ? list.find((r) => r.c.id === openId) ?? (await db.select({ c: schema.chats, who: schema.users.name }).from(schema.chats).leftJoin(schema.users, eq(schema.users.id, schema.chats.userId)).where(eq(schema.chats.id, openId)))[0] : undefined;
  const msgs = current ? await db.select().from(schema.chatMessages).where(eq(schema.chatMessages.chatId, current.c.id)).orderBy(asc(schema.chatMessages.createdAt)) : [];
  const name = (r: { c: typeof schema.chats.$inferSelect; who: string | null }) => r.who ?? r.c.guestName ?? 'Guest';

  return (
    <div>
      <Live />
      <PageHeader title="Live chat" sub="Answer innovators in real time. Outside working hours, messages queue here and your reply goes out by email or SMS." />
      <Notice tone={hours.open ? 'green' : 'amber'}>{hours.open ? <><b>Chat is open.</b> Innovators can see that consultants are online.</> : <><b>Chat is closed now</b> ({hours.reason.toLowerCase()}). Innovators see the opening hours and can leave a message.</>}</Notice>
      <div className="my-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Chats so far" value={stats.total} />
        <Stat label="Average wait for a first reply" value={`${stats.wait} min`} />
        <Stat label="Satisfaction" value={stats.rated ? `${stats.rating} / 5` : '–'} hint={`${stats.rated} ratings`} />
        <Stat label="Left outside hours" value={stats.offline} hint="Waiting for a reply" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="card overflow-hidden">
          <div className="flex border-b border-line text-sm">{(['open', 'closed'] as const).map((v) => <Link key={v} href={`?view=${v}`} className={`flex-1 p-3 text-center font-semibold ${view === v ? 'bg-sand' : 'text-muted'}`}>{v === 'open' ? 'Needs attention' : 'History'}</Link>)}</div>
          {list.length === 0 ? <div className="p-4"><Empty title="Nothing waiting">New chats appear here straight away.</Empty></div> : (
            <ul className="max-h-[32rem] divide-y divide-line overflow-y-auto">{list.map((r) => (
              <li key={r.c.id}><Link href={`?view=${view}&id=${r.c.id}`} className={`block p-3 text-sm hover:bg-sand/50 ${r.c.id === current?.c.id ? 'bg-sand/70' : ''}`}>
                <div className="flex items-center justify-between gap-2"><b className="truncate">{name(r)}</b><Badge tone={TONE[r.c.status]}>{r.c.status}</Badge></div>
                <div className="text-xs text-muted">{r.c.topic} · {ago(r.c.createdAt)}{r.c.consultantId === me.id ? ' · yours' : ''}</div>
              </Link></li>
            ))}</ul>
          )}
        </div>
        <div className="card flex min-h-[28rem] flex-col">
          {!current ? <div className="p-6"><Empty title="Pick a chat">Choose a conversation on the left.</Empty></div> : <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
              <div><div className="font-bold">{name(current)}</div><div className="text-xs text-muted">{current.c.topic} · started {fmtDateTime(current.c.createdAt)}{current.c.guestContact ? ` · ${current.c.guestContact}` : ''}{current.c.rating ? ` · rated ${current.c.rating}/5` : ''}</div></div>
              <div className="flex gap-2">
                {!current.c.consultantId && current.c.status === 'waiting' && <form action={claimChat.bind(null, current.c.id)}><Submit className="btn-primary">Take this chat</Submit></form>}
                {current.c.status !== 'closed' && <form action={closeChat.bind(null, current.c.id)}><Submit className="btn-ghost">End chat</Submit></form>}
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m) => m.from === 'system'
                ? <p key={m.id} className="text-center text-xs text-muted">{m.body}</p>
                : <div key={m.id} className={`flex ${m.from === 'consultant' ? 'justify-end' : ''}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.from === 'consultant' ? 'bg-[var(--brand)] text-white' : 'bg-sand'}`}>{m.body}<div className={`mt-1 text-[11px] ${m.from === 'consultant' ? 'text-white/70' : 'text-muted'}`}>{ago(m.createdAt)}</div></div></div>)}
            </div>
            {current.c.status !== 'closed' && (
              <form action={replyChat.bind(null, current.c.id)} className="flex gap-2 border-t border-line p-3">
                <input name="body" className="field" required maxLength={2000} placeholder={current.c.status === 'offline' ? 'Reply by email or SMS' : 'Type a reply'} />
                <Submit className="btn-primary">{current.c.status === 'offline' ? 'Send reply' : 'Send'}</Submit>
              </form>
            )}
          </>}
        </div>
      </div>
    </div>
  );
}
