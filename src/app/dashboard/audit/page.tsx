import { desc, ilike, or } from 'drizzle-orm';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Badge } from '@/components/ui';
import { verifyChain, rowHash } from '@/lib/audit';
import { fmtDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string; tamper?: string }> }) {
  await requireUser({ perm: 'audit.view' });
  const sp = await searchParams;
  const v = await verifyChain();
  const rows = await db.select().from(schema.audit).where(sp.q ? or(ilike(schema.audit.action, `%${sp.q}%`), ilike(schema.audit.actorName, `%${sp.q}%`)) : undefined).orderBy(desc(schema.audit.seq)).limit(150);
  // Tamper demo: recompute one row's hash as if someone had edited it in the database, without changing anything.
  const demo = sp.tamper && rows.length > 3 ? (() => { const r = rows[3]; const forged = rowHash(r.prevHash, { at: r.at, actorName: r.actorName, action: r.action, instanceId: r.instanceId, entryId: r.entryId, detail: { ...r.detail, edited: 'score raised to 95' } }); return { seq: r.seq, stored: r.hash, forged }; })() : null;
  return (
    <div>
      <PageHeader title="Audit trail" sub="Every sign-in, submission, score, decision and setting change is recorded. Each record contains the fingerprint of the one before it, so editing or deleting any record breaks the chain and shows up here." />
      <div className={`card mb-6 flex flex-wrap items-center gap-4 p-5 ${v.ok ? 'border-emerald-300' : 'border-rose-300'}`}>
        {v.ok ? <ShieldCheck size={36} className="text-emerald-600" /> : <ShieldAlert size={36} className="text-rose-600" />}
        <div className="flex-1"><div className="text-lg font-bold">{v.ok ? `Chain intact: all ${v.count} records verified` : `Chain broken at record #${v.brokenAt}`}</div><div className="mono break-all text-xs text-muted">head {v.head}</div></div>
        <a href="?tamper=1" className="btn-ghost">Show what tampering looks like</a>
        <a href="/api/audit/verify" className="btn-ghost" target="_blank">Public verify API</a>
      </div>
      {demo && <div className="card mb-6 border-amber-300 bg-amber-50 p-5 text-sm"><b>Simulation (nothing was changed):</b> if someone edited record #{demo.seq} to raise a score, its fingerprint would become <span className="mono break-all">{demo.forged.slice(0, 32)}…</span> instead of <span className="mono">{demo.stored.slice(0, 32)}…</span>, and every later record would stop matching. The check above would fail at #{demo.seq}.</div>}
      <form className="mb-3"><input name="q" defaultValue={sp.q} className="field" placeholder="Filter by action or person, e.g. entry.awarded" /></form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-muted"><tr><th className="p-3">#</th><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">What</th><th className="p-3">Details</th><th className="p-3">Fingerprint</th></tr></thead>
          <tbody className="divide-y divide-line">{rows.map((r) => <tr key={r.seq}><td className="mono p-3 text-xs">{r.seq}</td><td className="whitespace-nowrap p-3 text-xs">{fmtDateTime(r.at)}</td><td className="p-3">{r.actorName}</td><td className="p-3"><Badge tone="brand">{r.action}</Badge></td><td className="max-w-xs truncate p-3 text-xs text-muted" title={JSON.stringify(r.detail)}>{JSON.stringify(r.detail)}</td><td className="mono p-3 text-[11px] text-muted">{r.hash.slice(0, 12)}…</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
