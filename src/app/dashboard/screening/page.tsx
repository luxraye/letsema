import Link from 'next/link';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, StatusBadge, Empty, Stat } from '@/components/ui';
import { ago } from '@/lib/format';
import { shortlist, nudgeOverdue } from '@/app/actions/judging';
import { Submit } from '@/components/forms';

export const dynamic = 'force-dynamic';

export default async function Screening() {
  const me = await requireUser({ perm: 'entry.screen' });
  const scope = me.role === 'partner_admin' && me.spaceId ? eq(schema.instances.spaceId, me.spaceId) : undefined;
  const queue = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(and(inArray(schema.entries.status, ['submitted', 'screening']), scope)).orderBy(schema.entries.submittedAt);
  const progress = await db.select({ id: schema.instances.id, name: schema.instances.name, shortlistSize: sql<number>`(${schema.instances.definition}->>'shortlistSize')::int`, inReview: sql<number>`count(*) filter (where ${schema.entries.status} = 'in_review')::int`, shortlisted: sql<number>`count(*) filter (where ${schema.entries.status} = 'shortlisted')::int` }).from(schema.instances).leftJoin(schema.entries, eq(schema.entries.instanceId, schema.instances.id)).where(and(eq(schema.instances.status, 'live'), scope)).groupBy(schema.instances.id);
  const evalStats = await db.select({ instanceId: schema.entries.instanceId, total: sql<number>`count(*)::int`, done: sql<number>`count(${schema.evaluations.submittedAt})::int`, overdue: sql<number>`count(*) filter (where ${schema.evaluations.submittedAt} is null and ${schema.evaluations.dueAt} < now())::int` }).from(schema.evaluations).innerJoin(schema.entries, eq(schema.entries.id, schema.evaluations.entryId)).where(eq(schema.entries.status, 'in_review')).groupBy(schema.entries.instanceId);
  const [overdue] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.evaluations).where(and(isNull(schema.evaluations.submittedAt), sql`due_at < now()`));
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Level 1" title="Screening" sub="Check each new application is eligible and complete. Pass it to independent evaluators, ask for changes, or decline it with a reason." />
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Waiting for screening" value={queue.length} /><Stat label="Overdue scores" value={overdue.n} />{overdue.n > 0 && <form action={nudgeOverdue} className="card flex items-center p-4"><Submit className="btn-ghost w-full">Remind late evaluators</Submit></form>}</div>
      <section>
        <h2 className="mb-3 text-lg font-bold">New applications</h2>
        {queue.length === 0 ? <Empty title="All screened" /> : (
          <div className="card divide-y divide-line">{queue.map(({ e, i }) => <Link key={e.id} href={`/dashboard/screening/${e.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-sand/50"><div className="min-w-0 flex-1"><div className="font-semibold">{e.title}</div><div className="text-xs text-muted"><span className="mono">{e.ref}</span> · {i.name} · submitted {e.submittedAt ? ago(e.submittedAt) : ''}{e.version > 1 && ` · resubmission v${e.version}`}</div></div><StatusBadge status={e.status} /></Link>)}</div>
        )}
      </section>
      <section>
        <h2 className="mb-1 text-lg font-bold">Close scoring and shortlist</h2>
        <p className="mb-3 text-sm text-muted">When scoring is done, rank every application by calibrated score and move the top ones to the panel. The ranking is reproducible and its fingerprint goes into the audit trail.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {progress.map((p) => { const s = evalStats.find((x) => x.instanceId === p.id); const pct = s?.total ? Math.round((s.done / s.total) * 100) : 0; return (
            <div key={p.id} className="card p-4">
              <div className="font-semibold">{p.name}</div>
              <div className="mt-1 text-xs text-muted">{p.inReview} with evaluators · {p.shortlisted} shortlisted · top {p.shortlistSize} go to the panel</div>
              <div className="mt-3 h-2 rounded-full bg-sand"><div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} /></div>
              <div className="mt-1 text-xs text-muted">{s ? `${s.done} of ${s.total} scores in${s.overdue ? `, ${s.overdue} overdue` : ''}` : 'No scoring in progress'}</div>
              {p.inReview > 0 && <form action={shortlist.bind(null, p.id)} className="mt-3"><Submit className="btn-ghost">Rank and shortlist now</Submit></form>}
            </div>
          ); })}
        </div>
      </section>
    </div>
  );
}
