import Link from 'next/link';
import { eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Empty, Notice, Badge } from '@/components/ui';
import { calibrate, spread, DISAGREE } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export default async function Panel({ searchParams }: { searchParams: Promise<{ decided?: string }> }) {
  const me = await requireUser({ perm: 'entry.decide' });
  const sp = await searchParams;
  const rows = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(eq(schema.entries.status, 'shortlisted')).orderBy(schema.entries.rank);
  const ids = rows.map((r) => r.e.id);
  const evs = ids.length ? await db.select().from(schema.evaluations).where(inArray(schema.evaluations.entryId, ids)) : [];
  const all = await db.select({ entryId: schema.evaluations.entryId, evaluatorId: schema.evaluations.evaluatorId, total: schema.evaluations.total }).from(schema.evaluations);
  const cal = calibrate(all.filter((a) => a.total != null).map((a) => ({ ...a, total: a.total! })));
  const votes = ids.length ? await db.select().from(schema.votes).where(inArray(schema.votes.entryId, ids)) : [];
  const byInstance = [...new Map(rows.map((r) => [r.i.id, r.i])).values()];
  return (
    <div>
      <PageHeader eyebrow="Level 3" title="Panel decisions" sub="Shortlisted applications, ranked by calibrated score. Vote on each; a decision needs a majority of the panel." />
      {sp.decided && <div className="mb-4"><Notice tone="green">Decision recorded. The applicant and anyone following it have been told.</Notice></div>}
      {rows.length === 0 ? <Empty title="Nothing waiting for the panel" /> : byInstance.map((inst) => (
        <section key={inst.id} className="mb-8">
          <h2 className="mb-3 text-lg font-bold">{inst.name}</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-muted"><tr><th className="p-3">Rank</th><th className="p-3">Application</th><th className="p-3">Raw</th><th className="p-3">Calibrated</th><th className="p-3">Agreement</th><th className="p-3">Votes</th></tr></thead>
              <tbody className="divide-y divide-line">{rows.filter((r) => r.i.id === inst.id).map(({ e }) => {
                const raw = evs.filter((v) => v.entryId === e.id && v.total != null).map((v) => v.total!);
                const c = cal.filter((x) => x.entryId === e.id).map((x) => x.calibrated);
                const sp = spread(raw); const vs = votes.filter((v) => v.entryId === e.id); const mine = vs.find((v) => v.userId === me.id);
                return <tr key={e.id} className="hover:bg-sand/40"><td className="p-3 font-bold">#{e.rank ?? '–'}</td><td className="p-3"><Link href={`/dashboard/panel/${e.id}`} className="font-semibold hover:underline">{e.title}</Link><div className="mono text-xs text-muted">{e.ref}</div></td><td className="p-3">{raw.length ? (raw.reduce((a, b) => a + b, 0) / raw.length).toFixed(1) : '–'}</td><td className="p-3 font-bold">{c.length ? (c.reduce((a, b) => a + b, 0) / c.length).toFixed(1) : '–'}</td><td className="p-3">{sp > DISAGREE ? <Badge tone="red">Evaluators disagree ({sp.toFixed(0)} pts)</Badge> : <Badge tone="green">Agree</Badge>}</td><td className="p-3">{vs.length} cast{mine ? <Badge tone="brand">You: {mine.vote}</Badge> : <Badge tone="amber">Your vote needed</Badge>}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
