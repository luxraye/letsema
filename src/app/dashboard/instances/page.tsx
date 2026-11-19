import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Badge } from '@/components/ui';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Studio() {
  const me = await requireUser({ perm: 'instance.manage' });
  const rows = await db.select({ i: schema.instances, space: schema.spaces, n: sql<number>`(select count(*)::int from entries e where e.instance_id = ${schema.instances.id} and e.status <> 'draft')` }).from(schema.instances).innerJoin(schema.spaces, eq(schema.spaces.id, schema.instances.spaceId)).where(me.role === 'partner_admin' && me.spaceId ? eq(schema.instances.spaceId, me.spaceId) : undefined).orderBy(desc(schema.instances.updatedAt));
  const tone = { draft: 'gray', live: 'green', closed: 'amber', archived: 'gray' } as const;
  return (
    <div>
      <PageHeader eyebrow="Our flow, your rules" title="Instance Studio" sub="Every competition is an Instance: its own dates, form, score sheet, eligibility and team rules. Publish it and the rules are sealed with a fingerprint; any later change needs a reason and becomes a new public version." actions={<Link href="/dashboard/instances/new" className="btn-primary"><Plus size={16} /> New Instance</Link>} />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ i, space, n }) => (
          <Link key={i.id} href={`/dashboard/instances/${i.id}`} className="card p-5 transition hover:border-[var(--brand)]">
            <div className="flex items-center gap-2"><span className="chip text-white" style={{ background: space.primary }}>{space.short}</span><Badge tone={tone[i.status]}>{i.status}</Badge><span className="ml-auto text-xs text-muted">v{i.version}</span></div>
            <div className="mt-2 font-bold">{i.name}</div>
            <div className="mt-1 text-sm text-muted">{i.definition.kind} · {i.definition.stages.length} stages · {i.definition.form.length} questions · {i.definition.rubric.length} criteria · {n} entries</div>
            <div className="mono mt-2 text-[11px] text-muted">rules {i.rulesHash.slice(0, 16)}… · {fmtDate(i.opensAt)} → {fmtDate(i.closesAt)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
