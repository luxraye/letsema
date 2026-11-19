import { asc } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Tabs, Badge } from '@/components/ui';
import { ContentForm } from './form';
import { deleteContent } from '@/app/actions/admin';
import { ago } from '@/lib/format';

export const dynamic = 'force-dynamic';
const KINDS = [['faq', 'FAQs'], ['page', 'Pages'], ['notice', 'Notices'], ['document', 'Documents']] as const;

export default async function Content({ searchParams }: { searchParams: Promise<{ kind?: string; edit?: string }> }) {
  await requireUser({ perm: 'content.manage' });
  const sp = await searchParams;
  const kind = (KINDS.find(([k]) => k === sp.kind)?.[0] ?? 'faq');
  const rows = (await db.select().from(schema.content).orderBy(asc(schema.content.sort), asc(schema.content.title))).filter((r) => r.kind === kind);
  const editing = rows.find((r) => r.id === sp.edit);
  return (
    <div>
      <PageHeader title="Content" sub="Upload, change and remove what the public sees: FAQs, pages, notices and documents. Changes are live straight away and recorded in the audit trail. The application forms themselves are edited in the Instance Studio." />
      <Tabs active={kind} items={KINDS.map(([k, l]) => ({ key: k, label: l, href: `/dashboard/content?kind=${k}` }))} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="card divide-y divide-line">
          {rows.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1"><div className="font-semibold">{r.title} {!r.published && <Badge>hidden</Badge>}</div><div className="line-clamp-2 text-sm text-muted">{r.body}</div><div className="text-xs text-muted">{r.category ?? ''} · updated {ago(r.updatedAt)}</div></div>
              <a href={`/dashboard/content?kind=${kind}&edit=${r.id}`} className="btn-ghost !py-1.5">Edit</a>
              <form action={deleteContent.bind(null, r.id)}><button className="btn-ghost !py-1.5 text-rose-700">Delete</button></form>
            </div>
          ))}
          {!rows.length && <p className="p-4 text-sm text-muted">Nothing here yet.</p>}
        </div>
        <ContentForm key={editing?.id ?? kind} kind={kind} item={editing ? { id: editing.id, title: editing.title, body: editing.body, category: editing.category ?? '', slug: editing.slug ?? '', url: editing.url ?? '', published: editing.published, sort: editing.sort } : undefined} />
      </div>
    </div>
  );
}
