import { and, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Stat, Bars, Card, Info } from '@/components/ui';
import { PrintButton } from '@/components/print-button';
import { STATUS } from '@/lib/format';
import { pula } from '@/lib/instances';
import { evaluatorBias } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

const days = (ms: number) => Math.round((ms / 86_400_000) * 10) / 10;

export default async function Reports({ searchParams }: { searchParams: Promise<{ instance?: string }> }) {
  const me = await requireUser({ perm: 'reports.view' });
  const sp = await searchParams;
  const scope = me.role === 'partner_admin' && me.spaceId ? eq(schema.instances.spaceId, me.spaceId) : undefined;
  const instances = await db.select({ id: schema.instances.id, name: schema.instances.name }).from(schema.instances).where(scope);
  const where = and(ne(schema.entries.status, 'draft'), scope, sp.instance ? eq(schema.entries.instanceId, sp.instance) : undefined);
  const entries = await db.select({ e: schema.entries }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(where);
  const es = entries.map((r) => r.e);
  const ids = new Set(es.map((e) => e.id));
  const evals = (await db.select({ entryId: schema.evaluations.entryId, evaluatorId: schema.evaluations.evaluatorId, total: schema.evaluations.total, name: schema.users.name, submittedAt: schema.evaluations.submittedAt, dueAt: schema.evaluations.dueAt })
    .from(schema.evaluations).innerJoin(schema.users, eq(schema.users.id, schema.evaluations.evaluatorId)).where(isNotNull(schema.evaluations.submittedAt))).filter((v) => ids.has(v.entryId) && v.total != null);
  const chats = await db.select({ status: schema.chats.status, rating: schema.chats.rating, topic: schema.chats.topic, created: schema.chats.createdAt, first: schema.chats.firstReplyAt }).from(schema.chats);
  const [tk] = await db.select({ n: sql<number>`count(*)::int`, late: sql<number>`count(*) filter (where coalesce(${schema.tickets.resolvedAt}, now()) > ${schema.tickets.resolveBy})::int` }).from(schema.tickets);

  const count = <K extends string>(xs: (K | null)[]) => { const m = new Map<string, number>(); for (const x of xs) m.set(x ?? 'Not given', (m.get(x ?? 'Not given') ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })); };
  const awarded = es.filter((e) => e.status === 'awarded');
  const decided = es.filter((e) => e.decidedAt && e.submittedAt);
  const avgDecide = decided.length ? days(decided.reduce((s, e) => s + (e.decidedAt!.getTime() - e.submittedAt!.getTime()), 0) / decided.length) : 0;
  const teamAvg = es.length ? (es.reduce((s, e) => s + Math.max(1, e.team.length), 0) / es.length).toFixed(1) : '–';
  const sentBack = es.filter((e) => e.status === 'returned' || e.version > 1).length;
  const names = new Map(evals.map((v) => [v.evaluatorId, v.name]));
  const bias = evaluatorBias(evals.map((v) => ({ entryId: v.entryId, evaluatorId: v.evaluatorId, total: v.total! }))).sort((a, b) => a.bias - b.bias);
  const onTime = evals.filter((v) => v.submittedAt! <= v.dueAt).length;
  const rated = chats.filter((c) => c.rating);
  const answered = chats.filter((c) => c.first);
  const wait = answered.length ? Math.round(answered.reduce((s, c) => s + (c.first!.getTime() - c.created.getTime()), 0) / answered.length / 60_000) : 0;

  return (
    <div>
      <PageHeader title="Reports" sub="Participation, outcomes, timelines and fairness, worked out live from the data." actions={<><a className="btn-ghost" href="/api/reports/entries.csv">Applications CSV</a><a className="btn-ghost" href="/api/reports/chats.csv">Chats CSV</a><PrintButton /></>} />
      <form className="mb-5 flex gap-2 print:hidden"><select name="instance" defaultValue={sp.instance ?? ''} className="field max-w-md"><option value="">All competitions</option>{instances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select><button className="btn-ghost">Show</button></form>

      <h2 className="mb-3 text-lg font-bold">Participation</h2>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Applications" value={es.length} />
        <Stat label="Districts reached" value={new Set(es.map((e) => e.district).filter(Boolean)).size} />
        <Stat label="Average team size" value={teamAvg} />
        <Stat label="Asked for changes" value={sentBack} hint="Returned at screening" />
      </div>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h3 className="mb-3 font-bold">By sector</h3><Bars data={count(es.map((e) => e.sector))} /></Card>
        <Card className="p-5"><h3 className="mb-3 font-bold">By district</h3><Bars data={count(es.map((e) => e.district)).slice(0, 10)} /></Card>
      </div>

      <h2 className="mb-3 text-lg font-bold">Outcomes and timelines</h2>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Awarded" value={awarded.length} />
        <Stat label="Funding awarded" value={pula(awarded.reduce((s, e) => s + (e.awardAmount ?? 0), 0))} />
        <Stat label="Days from submission to decision" value={avgDecide || '–'} hint="Average" />
        <Stat label="Scores in on time" value={evals.length ? `${Math.round((onTime / evals.length) * 100)}%` : '–'} hint={`${evals.length} scores`} />
      </div>
      <Card className="mb-8 p-5"><h3 className="mb-3 font-bold">Where applications are now</h3><Bars data={Object.keys(STATUS).filter((k) => k !== 'draft').map((k) => ({ label: STATUS[k].label, value: es.filter((e) => e.status === k).length }))} /></Card>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">Evaluator fairness <Info>Each bar shows how far an evaluator&apos;s average sits from everyone&apos;s average. A harsh or generous marker is normal; calibration evens it out before ranking, so nobody is punished for drawing a tough evaluator.</Info></h2>
      <Card className="mb-8 overflow-x-auto p-5">
        <table className="w-full min-w-[520px] text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="pb-2">Evaluator</th><th className="pb-2">Scores</th><th className="pb-2">Average</th><th className="pb-2">Compared with everyone</th></tr></thead>
          <tbody className="divide-y divide-line">{bias.map((b) => <tr key={b.evaluatorId}><td className="py-2 font-semibold">{names.get(b.evaluatorId)}</td><td>{b.n}</td><td>{b.mean}</td><td><span className={`chip ${Math.abs(b.bias) >= 8 ? (b.bias < 0 ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-900') : 'bg-stone-100 text-stone-700'}`}>{b.bias > 0 ? '+' : ''}{b.bias}{Math.abs(b.bias) >= 8 ? (b.bias < 0 ? ' harsh' : ' generous') : ''}</span></td></tr>)}</tbody></table>
      </Card>

      <h2 className="mb-3 text-lg font-bold">Talking to innovators</h2>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Live chats" value={chats.length} />
        <Stat label="Average wait for a reply" value={`${wait} min`} />
        <Stat label="Satisfaction" value={rated.length ? `${(rated.reduce((s, c) => s + c.rating!, 0) / rated.length).toFixed(1)} / 5` : '–'} />
        <Stat label="Tickets past deadline" value={`${tk.late} of ${tk.n}`} />
      </div>
      <Card className="p-5"><h3 className="mb-3 font-bold">What people ask about</h3><Bars data={count(chats.map((c) => c.topic))} /></Card>
    </div>
  );
}
