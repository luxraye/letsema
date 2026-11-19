import { desc, ilike, or } from 'drizzle-orm';
import { Mail, MessageSquare } from 'lucide-react';
import { db, schema } from '@/db';
import { PageHeader, Empty } from '@/components/ui';
import { ago } from '@/lib/format';
import { AutoRefresh } from '@/components/auto-refresh';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Demo inbox' };

export default async function DemoInbox({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const rows = await db.select().from(schema.outbox).where(q ? or(ilike(schema.outbox.to, `%${q}%`), ilike(schema.outbox.body, `%${q}%`)) : undefined).orderBy(desc(schema.outbox.createdAt)).limit(60);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <AutoRefresh seconds={4} />
      <PageHeader eyebrow="Demo only" title="Demo inbox" sub="Every email and SMS the portal sends appears here, so you can test sign-up codes and alerts without a real address. In production these go out through the email and SMS gateways." />
      <form className="mb-4"><input name="q" defaultValue={q} className="field" placeholder="Filter by email, phone or text" /></form>
      {rows.length === 0 ? <Empty title="Nothing sent yet" /> : (
        <ul className="space-y-2">
          {rows.map((m) => (
            <li key={m.id} className="card p-4">
              <div className="flex items-center gap-2 text-sm">{m.channel === 'email' ? <Mail size={15} className="text-[var(--brand)]" /> : <MessageSquare size={15} className="text-emerald-700" />}<b>{m.to}</b><span className="ml-auto text-xs text-muted">{ago(m.createdAt)}</span></div>
              {m.subject && <div className="mt-1 font-semibold">{m.subject}</div>}
              <p className="mt-1 whitespace-pre-line text-sm text-muted">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
