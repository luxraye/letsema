import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { Badge } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { setInstanceStatus } from '@/app/actions/admin';
import { Submit } from '@/components/forms';
import { validateDefinition } from '@/lib/instances';
import { StudioEditor } from './studio';

export const dynamic = 'force-dynamic';
const PHOTOS = ['team-coding', 'young-makers', 'lab-drone', 'soldering', 'founders-meeting', 'okavango-aerial', 'mokoro', 'basket-weaver', 'tailor', 'gaborone-aerial', 'hero-lab'];

export default async function StudioOne({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser({ perm: 'instance.manage' });
  const [i] = await db.select().from(schema.instances).where(eq(schema.instances.id, id)).limit(1);
  if (!i || (me.role === 'partner_admin' && i.spaceId !== me.spaceId)) notFound();
  const versions = await db.select().from(schema.instanceVersions).where(eq(schema.instanceVersions.instanceId, id)).orderBy(desc(schema.instanceVersions.version));
  const problems = validateDefinition(i.definition);
  return (
    <div>
      <Link href="/dashboard/instances" className="text-sm text-muted hover:underline">← Instance Studio</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{i.name}</h1><Badge tone={i.status === 'live' ? 'green' : 'gray'}>{i.status}</Badge><span className="text-sm text-muted">version {i.version}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {i.status !== 'draft' && <Link href={`/i/${i.slug}`} className="btn-ghost" target="_blank">Public page</Link>}
          {i.status === 'draft' && <form action={setInstanceStatus.bind(null, id, 'live')}><Submit className="btn-primary" pending="Publishing…">{problems.length ? 'Fix rules to publish' : 'Publish and seal'}</Submit></form>}
          {i.status === 'live' && <form action={setInstanceStatus.bind(null, id, 'closed')}><Submit className="btn-ghost">Close entries</Submit></form>}
          {i.status === 'closed' && <form action={setInstanceStatus.bind(null, id, 'live')}><Submit className="btn-ghost">Reopen</Submit></form>}
        </div>
      </div>
      <StudioEditor id={id} live={i.status !== 'draft'} def={i.definition} meta={{ name: i.name, tagline: i.tagline, description: i.description, photo: i.photo ?? '' }} photos={PHOTOS.map((p) => `/photos/${p}.webp`)} rulesHash={i.rulesHash} />
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Version history</h2>
        <div className="card divide-y divide-line text-sm">{versions.length ? versions.map((v) => <div key={v.id} className="p-4"><div><b>v{v.version}</b> · {fmtDate(v.createdAt)} · <span className="mono text-xs text-muted">{v.rulesHash.slice(0, 16)}…</span></div><div className="text-muted">{v.reason}</div>{v.changes.length > 0 && <ul className="mt-1 list-disc pl-5">{v.changes.map((c) => <li key={c}>{c}</li>)}</ul>}</div>) : <p className="p-4 text-muted">Not published yet.</p>}</div>
      </section>
    </div>
  );
}
