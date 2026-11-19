import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useStore, PageHeader, Section, Stat, Bars, Spark, Donut, Tabs, Button } from '../../ui/kit';
import { STAGES, STATUS_META } from '../../core/workflow';
import { ideaScore, reviewerStats, globalStats } from '../../core/scoring';
import { daysBetween, download, mean, median, pula, toCsv, DAY } from '../../core/util';
import type { Idea, State } from '../../core/types';

type Tab = 'participation' | 'outcomes' | 'timelines' | 'reviewers' | 'chat';

export default function Reports() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>('participation');
  const [call, setCall] = useState('all');
  const ideas = s.ideas.filter((i) => i.status !== 'draft' && (call === 'all' || i.campaignId === call));
  return (
    <div>
      <PageHeader eyebrow="Reports" title="Participation, outcomes and timelines" sub="Live from the same data the pipeline uses. Every table exports to CSV."
        actions={<select className="field w-auto" value={call} onChange={(e) => setCall(e.target.value)} aria-label="Call"><option value="all">All calls</option>{s.campaigns.filter((c) => c.status !== 'draft').map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>} />
      <Tabs value={tab} onChange={setTab} items={[{ key: 'participation', label: 'Participation' }, { key: 'outcomes', label: 'Outcomes' }, { key: 'timelines', label: 'Timelines' }, { key: 'reviewers', label: 'Reviewers' }, { key: 'chat', label: 'Live chat' }]} />
      <div className="mt-6">
        {tab === 'participation' && <Participation s={s} ideas={ideas} />}
        {tab === 'outcomes' && <Outcomes s={s} ideas={ideas} />}
        {tab === 'timelines' && <Timelines ideas={ideas} />}
        {tab === 'reviewers' && <Reviewers s={s} />}
        {tab === 'chat' && <ChatReport s={s} />}
      </div>
    </div>
  );
}

function Csv({ name, rows }: { name: string; rows: Record<string, unknown>[] }) {
  return <Button variant="secondary" size="sm" onClick={() => download(`${name}.csv`, toCsv(rows))}><Download size={14} /> CSV</Button>;
}

function weekly(dates: string[], weeks = 16) {
  const now = Date.now();
  const out = new Array(weeks).fill(0);
  for (const d of dates) { const w = Math.floor((now - new Date(d).getTime()) / (7 * DAY)); if (w >= 0 && w < weeks) out[weeks - 1 - w]++; }
  return out;
}

function Participation({ s, ideas }: { s: State; ideas: Idea[] }) {
  const byCall = s.campaigns.filter((c) => c.status !== 'draft').map((c) => ({ label: c.title, value: ideas.filter((i) => i.campaignId === c.id).length }));
  const byDistrict = Object.entries(ideas.reduce<Record<string, number>>((a, i) => ((a[i.district] = (a[i.district] ?? 0) + 1), a), {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const bySector = Object.entries(ideas.reduce<Record<string, number>>((a, i) => ((a[i.sector] = (a[i.sector] ?? 0) + 1), a), {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const subs = weekly(ideas.map((i) => i.history.find((h) => h.status === 'submitted')?.at ?? i.createdAt));
  const regs = weekly(s.users.filter((u) => u.role === 'innovator').map((u) => u.createdAt));
  const staff = ideas.filter((i) => s.users.find((u) => u.id === i.ownerId)?.staff).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Submissions" value={ideas.length} />
        <Stat label="Innovators registered" value={s.users.filter((u) => u.role === 'innovator').length} />
        <Stat label="Districts" value={byDistrict.length} />
        <Stat label="From CEDA staff" value={staff} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Submissions per week" sub="Last 16 weeks"><Spark values={subs} label="Submissions per week" /><div className="mt-1 flex justify-between text-xs text-muted"><span>16 weeks ago</span><span>this week</span></div></Section>
        <Section title="New innovator accounts per week" sub="Last 16 weeks"><Spark values={regs} color="var(--accent)" label="Registrations per week" /></Section>
        <Section title="By call" action={<Csv name="participation-by-call" rows={byCall.map((r) => ({ call: r.label, submissions: r.value }))} />}><Bars data={byCall} /></Section>
        <Section title="By district" action={<Csv name="participation-by-district" rows={byDistrict.map((r) => ({ district: r.label, submissions: r.value }))} />}><Bars data={byDistrict.slice(0, 10)} color="var(--accent)" /></Section>
        <Section title="By sector" className="lg:col-span-2"><Bars data={bySector} /></Section>
      </div>
    </div>
  );
}

function Outcomes({ s, ideas }: { s: State; ideas: Idea[] }) {
  const stats = reviewerStats(s), g = globalStats(s);
  const reached = (k: number) => ideas.filter((i) => i.history.some((h) => { const st = STATUS_META[h.status].stage; return st && STAGES.findIndex((x) => x.key === st) >= k; })).length;
  const funnel = STAGES.map((st, k) => ({ label: st.label, value: reached(k) }));
  const decided = ideas.filter((i) => i.decision?.at);
  const approved = decided.filter((i) => i.decision!.outcome === 'approve').length;
  const declined = ideas.filter((i) => i.status === 'declined').length;
  const revised = ideas.filter((i) => i.history.some((h) => h.status === 'revision')).length;
  const awarded = ideas.filter((i) => i.award);
  const rows = ideas.map((i) => { const sc = ideaScore(s, i, stats, g); return { ref: i.ref, title: i.title, call: s.campaigns.find((c) => c.id === i.campaignId)?.title, status: STATUS_META[i.status].label, raw_score: sc.raw ?? '', calibrated_score: sc.calibrated ?? '', disagreement: sc.disagreement ? 'yes' : 'no', award: i.award?.amount ?? '' }; });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Approval rate" value={decided.length ? `${Math.round((approved / decided.length) * 100)}%` : '—'} hint={`${approved} of ${decided.length} committee decisions`} />
        <Stat label="Sent back for revision" value={revised} hint="Feedback loop used" />
        <Stat label="Awards" value={awarded.length} hint={pula(awarded.reduce((a, i) => a + (i.award?.amount ?? 0), 0))} />
        <Stat label="Not selected" value={declined} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Stage funnel" sub="How many ideas reached each stage"><Bars data={funnel} /></Section>
        <Section title="Where ideas are now">
          <div className="flex items-center gap-6">
            <Donut label="Ideas by status" parts={[
              { label: 'In progress', value: ideas.filter((i) => ['submitted', 'screening', 'in_review', 'committee', 'revision'].includes(i.status)).length, color: 'var(--brand)' },
              { label: 'Funded', value: ideas.filter((i) => ['approved', 'awarded', 'development'].includes(i.status)).length, color: 'var(--accent)' },
              { label: 'Not selected', value: declined, color: '#e11d48' },
            ]} />
            <ul className="space-y-1 text-sm"><li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-brand" />In progress</li><li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-accent" />Approved / funded</li><li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-rose-600" />Not selected</li></ul>
          </div>
        </Section>
      </div>
      <Section title="All ideas with scores" action={<Csv name="evaluation-outcomes" rows={rows} />}>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm"><thead className="sticky top-0 bg-card text-left text-muted"><tr><th className="py-2">Ref</th><th>Title</th><th>Status</th><th>Raw</th><th>Calibrated</th></tr></thead>
            <tbody>{rows.sort((a, b) => Number(b.calibrated_score || 0) - Number(a.calibrated_score || 0)).map((r) => <tr key={r.ref} className="border-t border-line"><td className="py-1.5 font-mono text-xs">{r.ref}</td><td>{r.title}</td><td>{r.status}</td><td className="tabular-nums">{r.raw_score}</td><td className="font-semibold tabular-nums text-brand">{r.calibrated_score}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Timelines({ ideas }: { ideas: Idea[] }) {
  const durations: Record<string, number[]> = {};
  for (const i of ideas) for (let k = 0; k < i.history.length - 1; k++) {
    const h = i.history[k]!, n = i.history[k + 1]!;
    (durations[h.status] ??= []).push(daysBetween(h.at, n.at));
  }
  const stageRows = (['submitted', 'screening', 'in_review', 'revision', 'committee', 'approved'] as const).map((st) => ({ label: STATUS_META[st].label, value: Math.round(mean(durations[st] ?? []) * 10) / 10, sub: `median ${Math.round(median(durations[st] ?? []) * 10) / 10}` }));
  const toDecision = ideas.filter((i) => i.decision?.at && i.versions[0]).map((i) => daysBetween(i.versions[0]!.at, i.decision!.at));
  const overdue = ideas.filter((i) => i.status === 'in_review' && i.assignments.some((a) => !a.conflict?.declared && new Date(a.dueAt).getTime() < Date.now() && !i.reviews.some((r) => r.reviewerId === a.reviewerId && r.round === i.round)));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Submission → decision" value={toDecision.length ? `${Math.round(mean(toDecision))} days` : '—'} hint="Average across decided ideas" />
        <Stat label="Fastest decision" value={toDecision.length ? `${Math.round(Math.min(...toDecision))} days` : '—'} />
        <Stat label="Reviews overdue now" value={overdue.length} />
      </div>
      <Section title="Average days spent in each status" sub="Shows where ideas wait longest" action={<Csv name="stage-timelines" rows={stageRows.map((r) => ({ status: r.label, mean_days: r.value, median_days: r.sub.replace('median ', '') }))} />}>
        <Bars data={stageRows} fmt={(n) => `${n} d`} />
      </Section>
    </div>
  );
}

function Reviewers({ s }: { s: State }) {
  const stats = useMemo(() => reviewerStats(s), [s]);
  const g = globalStats(s);
  const rows = s.users.filter((u) => u.role === 'reviewer').map((u) => {
    const st = stats.get(u.id);
    const open = s.ideas.filter((i) => i.status === 'in_review' && i.assignments.some((a) => a.reviewerId === u.id && !a.conflict?.declared) && !i.reviews.some((r) => r.reviewerId === u.id && r.round === i.round)).length;
    const conflicts = s.ideas.filter((i) => i.assignments.some((a) => a.reviewerId === u.id && a.conflict?.declared)).length;
    return { reviewer: u.name, reviews: st?.n ?? 0, open, conflicts, average: st ? Math.round(st.mean * 10) / 10 : '', vs_panel: st ? Math.round((st.mean - g.mean) * 10) / 10 : '' };
  });
  return (
    <Section title="Reviewer workload and marking" sub={`Panel average ${g.mean.toFixed(1)}. Positive = more generous than the panel; calibration corrects for it.`} action={<Csv name="reviewers" rows={rows} />}>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-muted"><tr><th className="py-2">Reviewer</th><th>Reviews</th><th>Open</th><th>Conflicts declared</th><th>Average</th><th>vs panel</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.reviewer} className="border-t border-line"><td className="py-2 font-semibold">{r.reviewer}</td><td>{r.reviews}</td><td>{r.open}</td><td>{r.conflicts}</td><td className="tabular-nums">{r.average}</td><td className={`tabular-nums font-semibold ${Number(r.vs_panel) > 3 ? 'text-amber-700' : Number(r.vs_panel) < -3 ? 'text-sky-700' : ''}`}>{r.vs_panel !== '' && Number(r.vs_panel) > 0 ? '+' : ''}{r.vs_panel}</td></tr>)}</tbody>
      </table></div>
    </Section>
  );
}

export function ChatReport({ s }: { s: State }) {
  const conv = s.conversations;
  const answered = conv.filter((c) => c.firstResponseAt);
  const waits = answered.map((c) => (new Date(c.firstResponseAt!).getTime() - new Date(c.startedAt).getTime()) / 1000);
  const missed = conv.filter((c) => c.status === 'missed');
  const ratings = conv.filter((c) => c.rating).map((c) => c.rating!);
  const topics = Object.entries(conv.reduce<Record<string, number>>((a, c) => ((a[c.topic] = (a[c.topic] ?? 0) + 1), a), {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const byHour = new Array(10).fill(0);
  for (const c of conv) { const h = (new Date(c.startedAt).getUTCHours() + 2) % 24; if (h >= 8 && h < 18) byHour[h - 8]++; }
  const perAgent = Object.entries(answered.reduce<Record<string, number>>((a, c) => ((a[c.agentId ?? '?'] = (a[c.agentId ?? '?'] ?? 0) + 1), a), {})).map(([id, n]) => ({ label: s.users.find((u) => u.id === id)?.name ?? id, value: n }));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Conversations" value={conv.length} />
        <Stat label="Median first reply" value={waits.length ? `${Math.round(median(waits) / 60 * 10) / 10} min` : '—'} />
        <Stat label="After-hours / missed" value={missed.length} hint={`${Math.round((missed.length / (conv.length || 1)) * 100)}% of all chats`} />
        <Stat label="Satisfaction" value={ratings.length ? `${mean(ratings).toFixed(1)} / 5` : '—'} hint={`${ratings.length} ratings`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Topics" action={<Csv name="chat-topics" rows={topics.map((t) => ({ topic: t.label, chats: t.value }))} />}><Bars data={topics} /></Section>
        <Section title="Chats by hour (Gaborone)" sub="08:00–17:59"><Bars data={byHour.map((v, i) => ({ label: `${String(i + 8).padStart(2, '0')}:00`, value: v }))} color="var(--accent)" /></Section>
        <Section title="Handled per consultant"><Bars data={perAgent} /></Section>
      </div>
    </div>
  );
}
