import Link from 'next/link';
import { and, desc, eq, isNull, sql, inArray } from 'drizzle-orm';
import { ArrowRight } from 'lucide-react';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Stat, StatusBadge, Notice, Empty } from '@/components/ui';
import { STATUS, ago, fmtDate } from '@/lib/format';
import { liveInstances } from '@/lib/queries';
import { pula } from '@/lib/instances';
import { ROLE_LABEL } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

const greet = () => { const h = new Date(Date.now() + 2 * 3600_000).getUTCHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string; welcome?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const first = me.name.replace(/^(Dr|Prof\.?)\s+/, '').split(' ')[0];
  return (
    <div>
      <PageHeader eyebrow={ROLE_LABEL[me.role]} title={`${greet()}, ${first}`} />
      {sp.denied && <div className="mb-6"><Notice tone="red">Your role does not have access to that page.</Notice></div>}
      {sp.welcome && <div className="mb-6"><Notice tone="green">Welcome! Your email{me.phoneVerifiedAt ? ' and phone are' : ' is'} confirmed. Pick a competition to start.</Notice></div>}
      {me.role === 'innovator' && <Innovator userId={me.id} staff={me.organisation === 'CEDA'} />}
      {me.role === 'evaluator' && <Evaluator userId={me.id} />}
      {me.role === 'consultant' && <Consultant />}
      {['panel', 'observer', 'admin', 'superadmin', 'partner_admin'].includes(me.role) && <Oversight role={me.role} />}
    </div>
  );
}

async function Innovator({ userId, staff }: { userId: string; staff: boolean }) {
  const rows = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(eq(schema.entries.innovatorId, userId)).orderBy(desc(schema.entries.updatedAt));
  const notes = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt)).limit(5);
  const open = (await liveInstances(staff)).filter((x) => x.i.status === 'live' && !rows.some((r) => r.i.id === x.i.id)).slice(0, 3);
  const next = (s: string) => s === 'draft' ? 'Finish and submit' : s === 'returned' ? 'Read the feedback and resubmit' : s === 'awarded' ? 'Download your certificate' : 'Track progress';
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section>
        <h2 className="mb-3 text-lg font-bold">Your applications</h2>
        {rows.length === 0 ? <Empty title="No applications yet"><Link className="underline" href="/instances">Find a competition</Link> to get started.</Empty> : (
          <div className="space-y-3">
            {rows.map(({ e, i }) => (
              <Link key={e.id} href={e.status === 'draft' || e.status === 'returned' ? `/dashboard/entries/${e.id}/edit` : `/dashboard/entries/${e.id}`} className={`card flex flex-wrap items-center gap-4 p-4 transition hover:border-[var(--brand)] ${e.status === 'returned' ? 'border-orange-300 bg-orange-50/50' : ''}`}>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{e.title}</span><StatusBadge status={e.status} /></div><div className="mt-0.5 text-xs text-muted">{i.name} · <span className="mono">{e.ref}</span> · updated {ago(e.updatedAt)}</div><div className="mt-1 text-sm text-muted">{STATUS[e.status]?.plain}</div></div>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--brand)]">{next(e.status)} <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        )}
        {open.length > 0 && <><h2 className="mb-3 mt-8 text-lg font-bold">Open for you</h2><div className="grid gap-3 sm:grid-cols-3">{open.map((x) => <Link key={x.i.id} href={`/i/${x.i.slug}`} className="card p-4 hover:border-[var(--brand)]"><div className="text-xs font-bold text-muted">{x.space.short}</div><div className="font-semibold leading-snug">{x.i.name}</div><div className="mt-1 text-xs text-muted">Closes {fmtDate(x.i.closesAt)}</div></Link>)}</div></>}
      </section>
      <aside>
        <h2 className="mb-3 text-lg font-bold">Latest updates</h2>
        <div className="card divide-y divide-line">{notes.length ? notes.map((n) => <Link key={n.id} href={n.link ?? '#'} className="block p-3 text-sm hover:bg-sand/50"><div className="font-semibold">{n.title}</div><div className="text-muted">{n.body}</div><div className="mt-0.5 text-xs text-muted">{ago(n.createdAt)}</div></Link>) : <p className="p-4 text-sm text-muted">Updates on your applications will appear here.</p>}</div>
      </aside>
    </div>
  );
}

async function Evaluator({ userId }: { userId: string }) {
  const mine = await db.select({ ev: schema.evaluations, e: schema.entries }).from(schema.evaluations).innerJoin(schema.entries, eq(schema.entries.id, schema.evaluations.entryId)).where(eq(schema.evaluations.evaluatorId, userId));
  const todo = mine.filter((m) => !m.ev.submittedAt && m.ev.conflict !== true);
  const done = mine.filter((m) => m.ev.submittedAt);
  const [all] = await db.select({ avg: sql<number>`avg(total)` }).from(schema.evaluations).where(sql`total is not null`);
  const myAvg = done.length ? done.reduce((s, m) => s + (m.ev.total ?? 0), 0) / done.length : null;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="To score" value={todo.length} />
        <Stat label="Scored" value={done.length} />
        <Stat label="Due soonest" value={todo.length ? fmtDate(todo.map((t) => t.ev.dueAt).sort((a, b) => +a - +b)[0]) : '–'} />
        <Stat label="Your average vs panel" value={myAvg == null ? '–' : `${myAvg.toFixed(0)} / ${Number(all.avg ?? 0).toFixed(0)}`} hint="Calibration adjusts for strict or generous marking" />
      </div>
      <Link href="/dashboard/review" className="btn-primary">Open scoring queue <ArrowRight size={16} /></Link>
    </div>
  );
}

async function Consultant() {
  const [w] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.chats).where(eq(schema.chats.status, 'waiting'));
  const [o] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.tickets).where(inArray(schema.tickets.status, ['open', 'in_progress']));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link href="/dashboard/chat" className="card p-5 hover:border-[var(--brand)]"><div className="text-sm text-muted">Chats waiting</div><div className="text-3xl font-extrabold">{w.n}</div></Link>
      <Link href="/dashboard/support" className="card p-5 hover:border-[var(--brand)]"><div className="text-sm text-muted">Open support tickets</div><div className="text-3xl font-extrabold">{o.n}</div></Link>
    </div>
  );
}

async function Oversight({ role }: { role: string }) {
  const counts = await db.select({ s: schema.entries.status, n: sql<number>`count(*)::int` }).from(schema.entries).groupBy(schema.entries.status);
  const c = (k: string) => counts.find((x) => x.s === k)?.n ?? 0;
  const [award] = await db.select({ sum: sql<number>`coalesce(sum(award_amount),0)::int` }).from(schema.entries).where(eq(schema.entries.status, 'awarded'));
  const [overdue] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.evaluations).where(and(isNull(schema.evaluations.submittedAt), sql`due_at < now()`));
  const recent = await db.select().from(schema.audit).orderBy(desc(schema.audit.seq)).limit(6);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="To screen" value={c('submitted') + c('screening')} />
        <Stat label="With evaluators" value={c('in_review')} />
        <Stat label="Shortlisted" value={c('shortlisted')} />
        <Stat label="Awarded" value={c('awarded')} hint={pula(award.sum)} />
        <Stat label="Overdue scores" value={overdue.n} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(role === 'admin' || role === 'superadmin' || role === 'partner_admin') && <Link href="/dashboard/screening" className="btn-primary">Screening queue <ArrowRight size={16} /></Link>}
        {role === 'panel' && <Link href="/dashboard/panel" className="btn-primary">Panel decisions <ArrowRight size={16} /></Link>}
        <Link href="/dashboard/reports" className="btn-ghost">Reports</Link>
        <Link href="/dashboard/pipeline" className="btn-ghost">All applications</Link>
      </div>
      <section><h2 className="mb-3 text-lg font-bold">Latest activity</h2><div className="card divide-y divide-line text-sm">{recent.map((r) => <div key={r.seq} className="flex gap-3 p-3"><span className="mono text-xs text-muted">#{r.seq}</span><span className="flex-1"><b>{r.actorName}</b> · {r.action.replace('.', ' ').replace(/_/g, ' ')}</span><span className="text-xs text-muted">{ago(r.at)}</span></div>)}</div></section>
    </div>
  );
}
