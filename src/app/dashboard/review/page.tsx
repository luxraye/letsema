import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Empty, Notice, Badge } from '@/components/ui';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Queue({ searchParams }: { searchParams: Promise<{ scored?: string; reassigned?: string }> }) {
  const me = await requireUser({ perm: 'entry.review' });
  const sp = await searchParams;
  const rows = await db.select({ ev: schema.evaluations, e: schema.entries, i: schema.instances }).from(schema.evaluations).innerJoin(schema.entries, eq(schema.entries.id, schema.evaluations.entryId)).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(eq(schema.evaluations.evaluatorId, me.id)).orderBy(schema.evaluations.dueAt);
  const todo = rows.filter((r) => !r.ev.submittedAt && r.ev.conflict !== true);
  const done = rows.filter((r) => r.ev.submittedAt);
  const conflicts = rows.filter((r) => r.ev.conflict === true);
  return (
    <div>
      <PageHeader eyebrow="Level 2" title="Scoring queue" sub="Applications appear without the applicant’s name. Declare any conflict of interest before you read one; if you have a conflict it goes to another evaluator." />
      {sp.scored && <div className="mb-4"><Notice tone="green">Scores saved and sealed in the audit trail. Thank you.</Notice></div>}
      {sp.reassigned && <div className="mb-4"><Notice tone="blue">Conflict recorded. The application was passed to another evaluator.</Notice></div>}
      <h2 className="mb-3 text-lg font-bold">To score ({todo.length})</h2>
      {todo.length === 0 ? <Empty title="Nothing waiting">New assignments will appear here and in your notifications.</Empty> : (
        <div className="card divide-y divide-line">{todo.map(({ ev, e, i }) => { const late = ev.dueAt < new Date(); return <Link key={ev.id} href={`/dashboard/review/${ev.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-sand/50"><div className="min-w-0 flex-1"><div className="font-semibold">{e.title}</div><div className="text-xs text-muted">{i.name} · {e.sector ?? ''}</div></div>{ev.conflict === null && <Badge tone="amber">Declare conflict first</Badge>}<Badge tone={late ? 'red' : 'gray'}>{late ? 'Overdue' : `Due ${fmtDate(ev.dueAt)}`}</Badge></Link>; })}</div>
      )}
      <h2 className="mb-3 mt-8 text-lg font-bold">Scored ({done.length})</h2>
      {done.length > 0 && <div className="card divide-y divide-line">{done.map(({ ev, e }) => <Link key={ev.id} href={`/dashboard/review/${ev.id}`} className="flex items-center gap-3 p-3 text-sm hover:bg-sand/50"><span className="flex-1">{e.title}</span><b>{ev.total}</b><span className="text-muted">/ 100</span></Link>)}</div>}
      {conflicts.length > 0 && <p className="mt-6 text-sm text-muted">You declared a conflict on {conflicts.length} application{conflicts.length > 1 ? 's' : ''}.</p>}
    </div>
  );
}
