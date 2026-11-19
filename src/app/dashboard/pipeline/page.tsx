import Link from 'next/link';
import { and, desc, eq, ilike, ne, or } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, StatusBadge } from '@/components/ui';
import { ago } from '@/lib/format';
import { STATUS } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Pipeline({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; instance?: string }> }) {
  const me = await requireUser({ perm: 'entry.viewAll' });
  const sp = await searchParams;
  const instances = await db.select({ id: schema.instances.id, name: schema.instances.name, spaceId: schema.instances.spaceId }).from(schema.instances);
  const where = and(ne(schema.entries.status, 'draft'), sp.status ? eq(schema.entries.status, sp.status as never) : undefined, sp.instance ? eq(schema.entries.instanceId, sp.instance) : undefined, sp.q ? or(ilike(schema.entries.title, `%${sp.q}%`), ilike(schema.entries.ref, `%${sp.q}%`)) : undefined, me.role === 'partner_admin' && me.spaceId ? eq(schema.instances.spaceId, me.spaceId) : undefined);
  const rows = await db.select({ e: schema.entries, i: schema.instances.name }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(where).orderBy(desc(schema.entries.updatedAt)).limit(300);
  const link = (e: { id: string; status: string }) => ['submitted', 'screening'].includes(e.status) && me.role !== 'observer' && me.role !== 'panel' ? `/dashboard/screening/${e.id}` : `/dashboard/panel/${e.id}`;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div>
      <PageHeader title="All applications" sub={me.role === 'observer' ? 'Read-only view for committee observers.' : undefined} actions={<a href={`/api/reports/entries.csv${qs ? `?${qs}` : ''}`} className="btn-ghost">Download CSV</a>} />
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_16rem_auto]">
        <input name="q" defaultValue={sp.q} className="field" placeholder="Search title or reference" />
        <select name="status" defaultValue={sp.status ?? ''} className="field"><option value="">Any status</option>{Object.entries(STATUS).filter(([k]) => k !== 'draft').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select name="instance" defaultValue={sp.instance ?? ''} className="field"><option value="">Any competition</option>{instances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <button className="btn-primary">Filter</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-muted"><tr><th className="p-3">Application</th><th className="p-3">Competition</th><th className="p-3">Status</th><th className="p-3">Score</th><th className="p-3">Updated</th></tr></thead>
          <tbody className="divide-y divide-line">{rows.map(({ e, i }) => <tr key={e.id} className="hover:bg-sand/40"><td className="p-3"><Link className="font-semibold hover:underline" href={link(e)}>{e.title}</Link><div className="mono text-xs text-muted">{e.ref}</div></td><td className="p-3 text-muted">{i}</td><td className="p-3"><StatusBadge status={e.status} /></td><td className="p-3">{e.score ?? '–'}</td><td className="p-3 text-muted">{ago(e.updatedAt)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
