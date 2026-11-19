import { useMemo, useState } from 'react';
import { Download, Link2, ShieldCheck, ShieldAlert, Search, FlaskConical } from 'lucide-react';
import { useStore, PageHeader, Button, Badge, Stat } from '../../ui/kit';
import { verifyChain } from '../../core/store';
import { download, fmtDateTime, toCsv } from '../../core/util';

export default function Audit() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<ReturnType<typeof verifyChain> | null>(null);
  const [tamper, setTamper] = useState<null | { seq: number; res: ReturnType<typeof verifyChain> }>(null);
  const list = useMemo(() => [...s.audit].reverse().filter((e) => !q || `${e.action} ${e.target} ${e.detail} ${e.actorRole} ${s.users.find((u) => u.id === e.actorId)?.name ?? ''}`.toLowerCase().includes(q.toLowerCase())), [s.audit, s.users, q]);
  const runTamper = () => {
    // Work on a copy: change one old entry's text, keep its stored hash, and re-verify.
    const copy = s.audit.map((e) => ({ ...e }));
    const victim = copy[Math.floor(copy.length / 3)]!;
    victim.detail = victim.detail + ' (edited)';
    setTamper({ seq: victim.seq, res: verifyChain(copy) });
  };
  return (
    <div>
      <PageHeader eyebrow="Oversight" title="Audit trail" sub="Every sign-in, submission, score, vote, decision, content change and permission change. Each entry includes the hash of the one before it, so editing or deleting history breaks the chain."
        actions={<Button variant="secondary" onClick={() => download('audit-trail.csv', toCsv(s.audit.map((e) => ({ seq: e.seq, at: e.at, actor: s.users.find((u) => u.id === e.actorId)?.name ?? e.actorId, role: e.actorRole, action: e.action, target: e.target, detail: e.detail, hash: e.hash }))))}><Download size={15} /> Export CSV</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Entries" value={s.audit.length} icon={<Link2 size={16} />} />
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Chain integrity</div>
          {result ? <div className={`mt-1 flex items-center gap-2 font-bold ${result.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{result.ok ? <><ShieldCheck size={18} /> Intact: {result.checked} links verified</> : <><ShieldAlert size={18} /> Broken at entry #{result.brokenAt}</>}</div> : <p className="mt-1 text-sm text-muted">Not checked yet</p>}
          <Button size="sm" className="mt-2" onClick={() => setResult(verifyChain(s.audit))}>Verify now</Button>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Tamper test</div>
          {tamper ? <p className="mt-1 text-sm">Edited entry #{tamper.seq} in a copy → <b className="text-rose-700">{tamper.res.ok ? 'not detected' : `detected at #${tamper.res.brokenAt}`}</b>. The real trail is unchanged.</p> : <p className="mt-1 text-sm text-muted">Simulate someone editing history.</p>}
          <Button size="sm" variant="secondary" className="mt-2" onClick={runTamper}><FlaskConical size={14} /> Run tamper test</Button>
        </div>
      </div>
      <div className="relative my-4 max-w-md"><Search size={16} className="absolute left-3 top-3 text-muted" /><input className="field pl-9" placeholder="Filter by person, action or reference" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter" /></div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-muted"><tr className="border-b border-line"><th className="p-3">#</th><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th><th>Hash</th></tr></thead>
          <tbody>{list.slice(0, 200).map((e) => (
            <tr key={e.seq} className="border-t border-line/60">
              <td className="p-3 tabular-nums text-muted">{e.seq}</td><td className="whitespace-nowrap">{fmtDateTime(e.at)}</td>
              <td>{s.users.find((u) => u.id === e.actorId)?.name ?? e.actorId} <span className="text-xs text-muted">{e.actorRole}</span></td>
              <td><Badge tone={e.action.startsWith('auth') ? 'sky' : e.action.startsWith('idea') ? 'brand' : e.action.startsWith('review') || e.action.startsWith('committee') ? 'violet' : 'slate'}>{e.action}</Badge></td>
              <td className="font-mono text-xs">{e.target}</td><td className="max-w-xs truncate">{e.detail}</td><td className="font-mono text-xs text-muted" title={e.hash}>{e.hash.slice(0, 8)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {list.length > 200 && <p className="mt-2 text-xs text-muted">Showing the latest 200 of {list.length}. Export for the full trail.</p>}
    </div>
  );
}
