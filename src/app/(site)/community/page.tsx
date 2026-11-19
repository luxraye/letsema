import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { MessageCircle, Pin, Plus } from 'lucide-react';
import { db, schema } from '@/db';
import { PageHeader, Avatar } from '@/components/ui';
import { FORUM_CATEGORIES } from '@/lib/catalogue';
import { ago } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Community' };

export default async function Community({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const rows = await db.select({ t: schema.threads, author: schema.users.name, replies: sql<number>`(select count(*)::int from replies r where r.thread_id = ${schema.threads.id})`, last: sql<Date | null>`(select max(created_at) from replies r where r.thread_id = ${schema.threads.id})` })
    .from(schema.threads).innerJoin(schema.users, eq(schema.users.id, schema.threads.authorId))
    .where(c ? eq(schema.threads.category, c) : undefined).orderBy(desc(schema.threads.pinned), desc(schema.threads.createdAt)).limit(100);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader eyebrow="Community" title="Ask other innovators" sub="Questions about pitching, teams, regulators and funding. CEDA consultants drop in too." actions={<Link href="/community/new" className="btn-primary"><Plus size={16} /> Ask a question</Link>} />
      <div className="mb-5 flex flex-wrap gap-2 text-sm"><Link href="/community" className={`chip border !py-1.5 ${!c ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>All</Link>{FORUM_CATEGORIES.map((k) => <Link key={k} href={`/community?c=${k}`} className={`chip border !py-1.5 ${c === k ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>{k}</Link>)}</div>
      <ul className="card divide-y divide-line">
        {rows.length === 0 && <li className="p-6 text-sm text-muted">No questions here yet. Be the first to ask.</li>}
        {rows.map(({ t, author, replies, last }) => (
          <li key={t.id}><Link href={`/community/${t.id}`} className="flex gap-3 p-4 hover:bg-sand/40">
            <Avatar name={author} size={36} />
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2 font-semibold">{t.pinned && <Pin size={14} className="text-[var(--brand)]" />}<span className="truncate">{t.title}</span></div><div className="text-xs text-muted">{t.category} · {author} · {ago(last ? new Date(last) : t.createdAt)}</div></div>
            <span className="flex items-center gap-1 text-sm text-muted"><MessageCircle size={15} />{replies}</span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
