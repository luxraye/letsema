import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, EyeOff } from 'lucide-react';
import { useMe, useStore, PageHeader, Badge } from '../../ui/kit';
import { STAGES, STATUS_META } from '../../core/workflow';
import { ideaScore, reviewerStats, globalStats } from '../../core/scoring';
import { can } from '../../core/rbac';
import { ago } from '../../core/util';

export default function Pipeline() {
  const me = useMe()!;
  const s = useStore();
  const [call, setCall] = useState('all');
  const [sort, setSort] = useState<'score' | 'recent'>('score');
  const stats = useMemo(() => reviewerStats(s), [s]);
  const g = useMemo(() => globalStats(s), [s]);
  const ideas = s.ideas.filter((i) => i.status !== 'draft' && i.status !== 'withdrawn' && (call === 'all' || i.campaignId === call));
  const cols = [...STAGES.map((st) => ({ key: st.key, label: st.label, items: ideas.filter((i) => STATUS_META[i.status].stage === st.key) })), { key: 'declined', label: 'Not selected', items: ideas.filter((i) => i.status === 'declined') }];
  const showNames = can(s, me, 'idea.view.identity');
  return (
    <div>
      <PageHeader eyebrow={me.role === 'observer' ? 'Committee observer · read-only' : 'Innovation committee'} title="Pipeline board" sub="Every idea in every stage, updated live. Scores shown are calibrated."
        actions={<>
          <select className="field w-auto" value={call} onChange={(e) => setCall(e.target.value)} aria-label="Filter by call"><option value="all">All calls</option>{s.campaigns.filter((c) => c.status !== 'draft').map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
          <select className="field w-auto" value={sort} onChange={(e) => setSort(e.target.value as 'score' | 'recent')} aria-label="Sort"><option value="score">Highest score first</option><option value="recent">Most recent first</option></select>
        </>} />
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="grid min-w-[1100px] grid-cols-7 gap-3">
          {cols.map((col) => {
            const items = col.items.map((i) => ({ i, sc: ideaScore(s, i, stats, g) })).sort((a, b) => sort === 'score' ? (b.sc.calibrated ?? -1) - (a.sc.calibrated ?? -1) : b.i.updatedAt.localeCompare(a.i.updatedAt));
            return (
              <section key={col.key} className="flex flex-col rounded-2xl bg-ink/[0.035] p-2" aria-label={col.label}>
                <div className="mb-2 flex items-center justify-between px-1.5 pt-1"><h2 className="text-sm font-bold">{col.label}</h2><span className="rounded-full bg-card px-2 text-xs font-bold">{items.length}</span></div>
                <div className="space-y-2">
                  {items.map(({ i, sc }) => (
                    <Link key={i.id} to={`/app/ideas/${i.id}`} className="block rounded-xl border border-line bg-card p-3 text-sm shadow-sm transition hover:border-brand">
                      <div className="flex items-center justify-between gap-1 text-[11px] text-muted"><span className="font-mono">{i.ref}</span><span>{ago(i.updatedAt)}</span></div>
                      <div className="mt-1 line-clamp-2 font-semibold leading-snug">{i.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge tone={STATUS_META[i.status].tone}>{STATUS_META[i.status].label}</Badge>
                        {sc.calibrated != null && <Badge tone="brand">{sc.calibrated}</Badge>}
                        {sc.disagreement && <Badge tone="amber"><AlertTriangle size={11} /> split</Badge>}
                        {i.round > 1 && <Badge>v{i.versions.length}</Badge>}
                      </div>
                      <div className="mt-1.5 text-[11px] text-muted">{showNames ? s.users.find((u) => u.id === i.ownerId)?.name : <span className="inline-flex items-center gap-1"><EyeOff size={11} /> blind</span>}</div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
