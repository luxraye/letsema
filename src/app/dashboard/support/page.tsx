import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { SLA, type Severity } from '@/lib/sla';
import { PageHeader, Stat, Badge, Empty } from '@/components/ui';
import { Submit } from '@/components/forms';
import { fmtDateTime, ago } from '@/lib/format';
import { updateTicket } from '@/app/actions/support';

export const dynamic = 'force-dynamic';

const SEV_TONE: Record<Severity, string> = { P1: 'red', P2: 'amber', P3: 'blue', P4: 'gray' };

export default async function Support({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser({ perm: 'chat.answer' });
  const sp = await searchParams;
  const all = await db.select().from(schema.tickets).orderBy(desc(schema.tickets.createdAt)).limit(200);
  const rows = sp.status ? all.filter((t) => t.status === sp.status) : all.filter((t) => t.status !== 'resolved');
  const now = Date.now();
  const late = (by: Date, done: Date | null) => (done ? done.getTime() : now) > by.getTime();
  const resolved = all.filter((t) => t.resolvedAt);
  const onTime = resolved.filter((t) => !late(t.resolveBy, t.resolvedAt)).length;
  return (
    <div>
      <PageHeader title="Support tickets" sub="Faults and requests, each with a response and fix deadline set by how serious it is." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open" value={all.filter((t) => t.status !== 'resolved').length} />
        <Stat label="Past response deadline" value={all.filter((t) => !t.firstResponseAt && late(t.respondBy, null)).length} />
        <Stat label="Resolved on time" value={resolved.length ? `${Math.round((onTime / resolved.length) * 100)}%` : '–'} hint={`${resolved.length} resolved`} />
        <Stat label="Critical open" value={all.filter((t) => t.severity === 'P1' && t.status !== 'resolved').length} />
      </div>
      <form className="mb-4 flex gap-2 text-sm">
        <select name="status" defaultValue={sp.status ?? ''} className="field max-w-xs"><option value="">Not yet resolved</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
        <button className="btn-ghost">Show</button>
      </form>
      {rows.length === 0 ? <Empty title="No tickets here" /> : (
        <ul className="space-y-3">{rows.map((t) => {
          const respondLate = !t.firstResponseAt && late(t.respondBy, null);
          const resolveLate = late(t.resolveBy, t.resolvedAt);
          return (
            <li key={t.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><div className="flex flex-wrap items-center gap-2"><Badge tone={SEV_TONE[t.severity]} title={SLA[t.severity].label}>{t.severity}</Badge><span className="mono text-xs text-muted">{t.ref}</span><Badge tone={t.status === 'resolved' ? 'green' : t.status === 'in_progress' ? 'blue' : 'amber'}>{t.status.replace('_', ' ')}</Badge></div><div className="mt-1 font-bold">{t.subject}</div><div className="text-xs text-muted">{t.name} · {t.category} · opened {ago(t.createdAt)}</div></div>
                <div className="text-right text-xs"><div className={respondLate ? 'font-bold text-rose-700' : 'text-muted'}>Respond by {fmtDateTime(t.respondBy)}{t.firstResponseAt ? ' ✓' : ''}</div><div className={resolveLate && t.status !== 'resolved' ? 'font-bold text-rose-700' : 'text-muted'}>Resolve by {fmtDateTime(t.resolveBy)}{t.resolvedAt ? (resolveLate ? ' (late)' : ' ✓') : ''}</div></div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm">{t.body}</p>
              {t.resolution && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm"><b>Latest update:</b> {t.resolution}</p>}
              <form action={updateTicket.bind(null, t.id)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
                <input name="note" className="field" placeholder="Reply to the reporter (sent by email or SMS)" maxLength={2000} />
                <select name="status" defaultValue={t.status} className="field"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
                <Submit className="btn-primary">Update</Submit>
              </form>
            </li>
          );
        })}</ul>
      )}
    </div>
  );
}
