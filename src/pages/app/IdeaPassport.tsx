import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { AlertTriangle, CheckCircle2, Lock, Paperclip, Send, ShieldAlert, Pencil, Undo2, Award, Flag, EyeOff } from 'lucide-react';
import { useMe, useStore, Button, Badge, StatusBadge, StageTrack, Tabs, Empty, Avatar, attempt, Field, Section, Tip } from '../../ui/kit';
import { can } from '../../core/rbac';
import { STATUS_META } from '../../core/workflow';
import { ideaScore, reviewTotal, reviewerStats, globalStats, calibrate } from '../../core/scoring';
import { fmtDate, fmtDateTime, pula, ago } from '../../core/util';
import {
  castVote, confirmAward, finaliseDecision, postMessage, resubmit, returnForRevision, screen, submitEvidence, verifyMilestone, withdrawIdea, receipt,
} from '../../core/actions';
import type { Idea, Campaign, State, User } from '../../core/types';
import { DAY } from '../../core/util';

type Tab = 'overview' | 'feedback' | 'scores' | 'versions' | 'timeline' | 'milestones';

export default function IdeaPassport() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const me = useMe()!;
  const s = useStore();
  const idea = s.ideas.find((i) => i.id === id);
  const [tab, setTab] = useState<Tab>(params.get('resubmit') ? 'feedback' : 'overview');
  if (!idea) return <Empty title="Idea not found" />;
  const c = s.campaigns.find((x) => x.id === idea.campaignId)!;
  const isOwner = idea.ownerId === me.id;
  const pipeline = can(s, me, 'idea.view.pipeline') || can(s, me, 'idea.screen');
  const assigned = idea.assignments.some((a) => a.reviewerId === me.id);
  if (!isOwner && !pipeline && !assigned) return <Empty icon={<Lock />} title="You do not have access to this idea">Ideas are visible only to their owner and the people evaluating them.</Empty>;
  if (assigned && !pipeline && !isOwner) return <Empty title="Open this idea from your review queue"><Link className="text-brand underline" to={`/app/review/${idea.id}`}>Go to the blind review screen</Link></Empty>;
  const showIdentity = isOwner || can(s, me, 'idea.view.identity');
  const owner = s.users.find((u) => u.id === idea.ownerId);
  const reviewsVisible = isOwner ? !['submitted', 'screening', 'in_review'].includes(idea.status) : true;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'feedback', label: `Feedback (${idea.thread.filter((m) => m.visibility === 'shared' || !isOwner).length})` },
    { key: 'scores', label: 'Scores' },
    { key: 'versions', label: `Versions (${idea.versions.length})` },
    { key: 'timeline', label: 'Timeline' },
    ...(idea.milestones.length ? [{ key: 'milestones' as Tab, label: 'Milestones' }] : []),
  ];

  return (
    <div>
      <div className="mb-2 text-sm"><Link to={isOwner ? '/app/ideas' : '/app/pipeline'} className="font-semibold text-brand">← {isOwner ? 'My ideas' : 'Pipeline'}</Link></div>
      <div className="card mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted"><span className="font-mono">{idea.ref}</span>·<span>{c.title}</span>{idea.round > 1 && <Badge tone="amber">Round {idea.round}</Badge>}</div>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{idea.title}</h1>
            <p className="mt-1 max-w-3xl text-muted">{idea.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {showIdentity ? <span className="flex items-center gap-2"><Avatar name={owner?.name ?? '?'} size={22} />{owner?.name}{owner?.org && <span className="text-muted">· {owner.org}</span>}</span>
                : <span className="flex items-center gap-1.5 text-muted"><EyeOff size={15} /> Submitter hidden (blind)</span>}
              <span className="text-muted">{idea.sector} · {showIdentity ? idea.district : 'District hidden'}</span>
            </div>
          </div>
          <StatusBadge status={idea.status} />
        </div>
        <div className="mt-6"><StageTrack idea={idea} /></div>
        <p className="mt-4 rounded-xl bg-paper p-3 text-sm"><b>{isOwner ? 'What happens next: ' : 'Status: '}</b>{STATUS_META[idea.status].next}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <Tabs value={tab} onChange={setTab} items={tabs} />
          {tab === 'overview' && <Overview idea={idea} c={c} />}
          {tab === 'feedback' && <Thread idea={idea} me={me} isOwner={isOwner} />}
          {tab === 'scores' && (reviewsVisible ? <Scores idea={idea} c={c} s={s} detailed={pipeline} /> : <Empty title="Scores appear when review is complete">You will be notified as soon as feedback is ready.</Empty>)}
          {tab === 'versions' && <Versions idea={idea} c={c} />}
          {tab === 'timeline' && <Timeline idea={idea} s={s} showNames={pipeline} />}
          {tab === 'milestones' && <Milestones idea={idea} me={me} isOwner={isOwner} />}
        </div>
        <aside className="space-y-4">
          {isOwner && <OwnerActions idea={idea} me={me} resubmitOpen={!!params.get('resubmit')} />}
          {can(s, me, 'idea.screen') && ['submitted', 'screening'].includes(idea.status) && <ScreenPanel idea={idea} me={me} />}
          {can(s, me, 'idea.screen') && idea.status === 'in_review' && <Assignments idea={idea} s={s} />}
          {idea.status === 'committee' && pipeline && <CommitteePanel idea={idea} c={c} me={me} s={s} />}
          {idea.status === 'approved' && can(s, me, 'idea.award') && <AwardPanel idea={idea} c={c} me={me} />}
          {idea.award && <AwardCard idea={idea} />}
          {me.role === 'observer' && <Tip>You are viewing as an external committee observer: everything is read-only.</Tip>}
        </aside>
      </div>
    </div>
  );
}

function Overview({ idea, c }: { idea: Idea; c: Campaign }) {
  const r = idea.versions.length ? receipt(idea) : null;
  return (
    <div className="card divide-y divide-line">
      {c.form.map((f) => (
        <div key={f.id} className="p-4"><div className="text-sm font-semibold text-muted">{f.label}</div><div className="mt-1 whitespace-pre-wrap">{f.type === 'checkbox' ? (idea.answers[f.id] === 'yes' ? 'Yes' : 'No') : f.id === 'ask' && idea.answers[f.id] ? pula(Number(idea.answers[f.id])) : idea.answers[f.id] || '—'}</div></div>
      ))}
      {idea.team.length > 0 && <div className="p-4"><div className="text-sm font-semibold text-muted">Team</div><div className="mt-1">{idea.team.join(', ')}</div></div>}
      <div className="p-4">
        <div className="text-sm font-semibold text-muted">Documents</div>
        <ul className="mt-2 space-y-1.5">{idea.attachments.map((a) => <li key={a.id} className="flex items-center gap-2 text-sm"><Paperclip size={14} /> <span className="flex-1">{a.name}</span><code className="text-xs text-muted" title="SHA-256">{a.sha256.slice(0, 10)}…</code></li>)}{!idea.attachments.length && <li className="text-sm text-muted">None</li>}</ul>
      </div>
      {r && <div className="p-4 text-sm"><span className="text-muted">Receipt fingerprint:</span> <code className="break-all text-xs">{r.fingerprint}</code></div>}
    </div>
  );
}

function Thread({ idea, me, isOwner }: { idea: Idea; me: User; isOwner: boolean }) {
  const s = useStore();
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const msgs = idea.thread.filter((m) => m.visibility === 'shared' || !isOwner);
  const readOnly = me.role === 'observer' || ['declined', 'withdrawn'].includes(idea.status) && isOwner;
  return (
    <div className="card p-4">
      <ul className="space-y-4">
        {msgs.map((m) => {
          const a = s.users.find((u) => u.id === m.authorId);
          const mine = m.authorId === me.id;
          const label = isOwner && !mine ? (a?.role === 'admin' ? 'CEDA programme team' : a?.role === 'adjudicator' ? 'Innovation committee' : 'Reviewer') : a?.name;
          return (
            <li key={m.id} className={`flex gap-3 ${mine ? 'flex-row-reverse text-right' : ''}`}>
              <Avatar name={label ?? '?'} size={30} />
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-left ${m.visibility === 'internal' ? 'border border-dashed border-amber-400 bg-amber-50' : mine ? 'bg-brand-soft' : 'bg-paper'}`}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted"><b className="text-ink">{label}</b>{m.visibility === 'internal' && <Badge tone="amber">Internal note: innovator can’t see</Badge>}<span>{ago(m.at)}</span></div>
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
              </div>
            </li>
          );
        })}
        {!msgs.length && <li className="py-6 text-center text-sm text-muted">No messages yet.</li>}
      </ul>
      {!readOnly && (
        <form className="mt-4 space-y-2 border-t border-line pt-4" onSubmit={(e) => { e.preventDefault(); if (attempt(() => postMessage(me, idea.id, body, internal ? 'internal' : 'shared'), internal ? 'Internal note added' : 'Message sent') !== undefined) setBody(''); }}>
          <textarea className="field min-h-20" placeholder={isOwner ? 'Reply to the reviewers or ask a question…' : 'Write constructive feedback…'} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Message" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!isOwner ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-[var(--brand)]" /> Internal note (staff only)</label> : <span className="text-xs text-muted">The programme team is notified of your reply.</span>}
            <Button type="submit" disabled={!body.trim()}><Send size={15} /> Send</Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Scores({ idea, c, s, detailed }: { idea: Idea; c: Campaign; s: State; detailed: boolean }) {
  const stats = useMemo(() => reviewerStats(s), [s]);
  const g = useMemo(() => globalStats(s), [s]);
  const sc = ideaScore(s, idea, stats, g);
  if (!sc.count) return <Empty title="No scores yet">Reviews in progress.</Empty>;
  const reviews = idea.reviews.filter((r) => r.round === idea.round).length ? idea.reviews.filter((r) => r.round === idea.round) : idea.reviews;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><div className="text-xs font-semibold text-muted">Average score</div><div className="font-display text-3xl font-extrabold">{sc.raw}</div><div className="text-xs text-muted">out of 100, {sc.count} reviews</div></div>
        <div className="card p-4"><div className="text-xs font-semibold text-muted">Calibrated score</div><div className="font-display text-3xl font-extrabold text-brand">{sc.calibrated}</div><div className="text-xs text-muted">adjusted for reviewer strictness</div></div>
        <div className={`card p-4 ${sc.disagreement ? 'border-amber-400' : ''}`}><div className="text-xs font-semibold text-muted">Reviewer spread</div><div className="font-display text-3xl font-extrabold">{sc.spread}</div><div className={`text-xs ${sc.disagreement ? 'font-semibold text-amber-700' : 'text-muted'}`}>{sc.disagreement ? 'Disagreement flagged for discussion' : 'Reviewers broadly agree'}</div></div>
      </div>
      <Section title="By criterion" sub="Average of reviewer scores (1–5) with their written reasons.">
        <div className="space-y-4">
          {c.criteria.map((cr) => (
            <div key={cr.id}>
              <div className="flex items-center justify-between text-sm"><b>{cr.name}</b><span className="tabular-nums">{sc.perCriterion[cr.id]?.toFixed(1)} / 5 <span className="text-muted">· weight {cr.weight}</span></span></div>
              <div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${((sc.perCriterion[cr.id] ?? 0) / 5) * 100}%` }} /></div>
              <ul className="mt-2 space-y-1">{reviews.map((r, i) => <li key={r.id} className="text-sm text-ink/80">“{r.comments[cr.id]}” <span className="text-xs text-muted">· {detailed ? s.users.find((u) => u.id === r.reviewerId)?.name : `Reviewer ${i + 1}`}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </Section>
      {detailed && (
        <Section title="Each reviewer" sub="Raw versus calibrated totals. A reviewer who marks harder than the panel is adjusted up, and vice versa.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted"><tr><th className="py-2">Reviewer</th><th>Raw</th><th>Calibrated</th><th>Their usual average</th><th>Recommends</th></tr></thead>
              <tbody>{reviews.map((r) => {
                const raw = reviewTotal(r, c);
                const st = stats.get(r.reviewerId);
                return (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-2">{s.users.find((u) => u.id === r.reviewerId)?.name}</td>
                    <td className="tabular-nums">{raw}</td>
                    <td className="font-semibold tabular-nums text-brand">{calibrate(raw, st, g)}</td>
                    <td className="tabular-nums text-muted">{st ? `${st.mean.toFixed(1)} (n=${st.n})` : '—'}</td>
                    <td><Badge tone={r.recommendation === 'advance' ? 'emerald' : r.recommendation === 'revise' ? 'amber' : 'rose'}>{r.recommendation}</Badge></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div className="mt-3 space-y-2">{reviews.map((r) => <p key={r.id} className="rounded-lg bg-paper p-3 text-sm"><b>{s.users.find((u) => u.id === r.reviewerId)?.name}:</b> {r.overall}</p>)}</div>
        </Section>
      )}
    </div>
  );
}

function diffWords(a: string, b: string) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  const m = A.length, n = B.length;
  if (m * n > 250_000) return [{ t: 'del', v: a }, { t: 'add', v: b }];
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i]![j] = A[i] === B[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const out: { t: 'same' | 'add' | 'del'; v: string }[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) { out.push({ t: 'same', v: A[i]! }); i++; j++; }
    else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) out.push({ t: 'del', v: A[i++]! });
    else out.push({ t: 'add', v: B[j++]! });
  }
  while (i < m) out.push({ t: 'del', v: A[i++]! });
  while (j < n) out.push({ t: 'add', v: B[j++]! });
  return out;
}

function Versions({ idea, c }: { idea: Idea; c: Campaign }) {
  const vs = idea.versions;
  const current = { n: vs.length + 1, title: idea.title, summary: idea.summary, answers: idea.answers };
  const hasDraftChanges = idea.status === 'revision' && JSON.stringify(current.answers) !== JSON.stringify(vs[vs.length - 1]?.answers) || (idea.status === 'revision' && (current.title !== vs[vs.length - 1]?.title || current.summary !== vs[vs.length - 1]?.summary));
  const options = [...vs.map((v) => ({ key: String(v.n), label: `v${v.n}` })), ...(hasDraftChanges ? [{ key: 'draft', label: 'Unsent edits' }] : [])];
  const [a, setA] = useState(vs.length > 1 ? String(vs.length - 1) : '1');
  const [b, setB] = useState(hasDraftChanges ? 'draft' : String(vs.length));
  if (!vs.length) return <Empty title="Not submitted yet" />;
  const get = (k: string) => (k === 'draft' ? current : vs.find((v) => String(v.n) === k)!);
  const A = get(a), B = get(b);
  const rows = [{ label: 'Title', a: A.title, b: B.title }, { label: 'Summary', a: A.summary, b: B.summary }, ...c.form.map((f) => ({ label: f.label, a: A.answers[f.id] ?? '', b: B.answers[f.id] ?? '' }))];
  const changed = rows.filter((r) => r.a !== r.b);
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 p-4 text-sm">
        Compare <select className="field w-auto" value={a} onChange={(e) => setA(e.target.value)}>{options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select>
        with <select className="field w-auto" value={b} onChange={(e) => setB(e.target.value)}>{options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select>
        <span className="text-muted">{changed.length} field{changed.length === 1 ? '' : 's'} changed</span>
      </div>
      {vs.filter((v) => v.n > 1).map((v) => <p key={v.n} className="rounded-xl bg-accent-soft p-3 text-sm"><b>v{v.n} note from innovator:</b> {v.note}</p>)}
      {changed.length === 0 && <Empty title="No differences between these versions" />}
      {changed.map((r) => (
        <div key={r.label} className="card p-4">
          <div className="mb-2 text-sm font-semibold text-muted">{r.label}</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{diffWords(r.a, r.b).map((p, i) => <span key={i} className={p.t === 'add' ? 'rounded bg-emerald-200/70 text-emerald-950' : p.t === 'del' ? 'rounded bg-rose-200/70 text-rose-900 line-through' : ''}>{p.v}</span>)}</p>
        </div>
      ))}
    </div>
  );
}

function Timeline({ idea, s, showNames }: { idea: Idea; s: State; showNames: boolean }) {
  return (
    <div className="card p-5">
      <ol className="space-y-4 border-l-2 border-line pl-5">
        {[...idea.history].reverse().map((h, i) => (
          <li key={i} className="relative">
            <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${i === 0 ? 'bg-brand ring-4 ring-brand-soft' : 'bg-line'}`} />
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={h.status} /><span className="text-xs text-muted">{fmtDateTime(h.at)}</span></div>
            {h.note && <p className="mt-1 text-sm">{h.note}</p>}
            {showNames && <p className="text-xs text-muted">by {s.users.find((u) => u.id === h.by)?.name ?? 'system'}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Milestones({ idea, me, isOwner }: { idea: Idea; me: User; isOwner: boolean }) {
  const s = useStore();
  const [ev, setEv] = useState<Record<string, string>>({});
  const released = idea.milestones.filter((m) => m.status === 'verified').reduce((a, m) => a + m.tranche, 0);
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex justify-between text-sm"><b>Funding released</b><span className="tabular-nums">{pula(released)} of {pula(idea.award?.amount ?? 0)}</span></div>
        <div className="mt-2 h-2.5 rounded-full bg-line"><div className="h-2.5 rounded-full bg-accent" style={{ width: `${idea.award?.amount ? (released / idea.award.amount) * 100 : 0}%` }} /></div>
      </div>
      {idea.milestones.map((m, i) => (
        <div key={m.id} className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><div className="text-xs text-muted">Milestone {i + 1} · due {fmtDate(m.due)}</div><div className="font-semibold">{m.title}</div></div>
            <div className="text-right"><Badge tone={m.status === 'verified' ? 'emerald' : m.status === 'evidence' ? 'amber' : m.status === 'in_progress' ? 'sky' : 'slate'}>{m.status === 'evidence' ? 'Evidence submitted' : m.status.replace('_', ' ')}</Badge><div className="mt-1 text-sm font-semibold tabular-nums">{pula(m.tranche)}</div></div>
          </div>
          {m.evidence && <p className="mt-2 rounded-lg bg-paper p-2 text-sm">Evidence: {m.evidence}</p>}
          {isOwner && m.status === 'in_progress' && (
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); attempt(() => submitEvidence(me, idea.id, m.id, ev[m.id] ?? ''), 'Evidence submitted for verification'); }}>
              <input className="field" placeholder="Describe your evidence (link, report, photos)…" value={ev[m.id] ?? ''} onChange={(e) => setEv({ ...ev, [m.id]: e.target.value })} />
              <Button type="submit">Submit</Button>
            </form>
          )}
          {can(s, me, 'idea.award') && m.status === 'evidence' && <Button className="mt-3" size="sm" onClick={() => attempt(() => verifyMilestone(me, idea.id, m.id), 'Verified and tranche released')}><CheckCircle2 size={15} /> Verify and release tranche</Button>}
        </div>
      ))}
    </div>
  );
}

function OwnerActions({ idea, me, resubmitOpen }: { idea: Idea; me: User; resubmitOpen: boolean }) {
  const [note, setNote] = useState('');
  const [confirmW, setConfirmW] = useState(false);
  return (
    <div className="card space-y-3 p-4">
      <div className="text-sm font-bold">Your actions</div>
      {idea.status === 'draft' && <Link to={`/app/ideas/${idea.id}/edit`} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"><Pencil size={15} /> Continue draft</Link>}
      {idea.status === 'revision' && (<>
        <p className="text-sm text-muted">Read the feedback, update your answers, then resubmit with a short note on what changed. The same reviewers will re-score it and see the differences.</p>
        <Link to={`/app/ideas/${idea.id}/edit`} className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"><Pencil size={15} /> Edit answers</Link>
        <div className={resubmitOpen ? 'rounded-xl ring-2 ring-accent p-2' : ''}>
          <Field label="What did you change?" htmlFor="rnote"><textarea id="rnote" className="field min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Added survey of 14 farmers and unit costs." /></Field>
          <Button className="mt-2 w-full" onClick={() => attempt(() => resubmit(me, idea.id, note), 'Resubmitted. Reviewers have been notified.')}><Undo2 size={15} /> Resubmit</Button>
        </div>
      </>)}
      {['submitted', 'screening', 'in_review', 'revision', 'draft'].includes(idea.status) && (
        confirmW ? <div className="flex gap-2"><Button variant="danger" size="sm" onClick={() => attempt(() => withdrawIdea(me, idea.id), 'Idea withdrawn')}>Yes, withdraw</Button><Button variant="ghost" size="sm" onClick={() => setConfirmW(false)}>Keep it</Button></div>
          : <button className="text-sm font-semibold text-rose-700 hover:underline" onClick={() => setConfirmW(true)}>Withdraw this idea</button>
      )}
      <Link to={`/track/${idea.ref}`} className="block text-sm font-semibold text-brand">Public tracker & free alerts →</Link>
    </div>
  );
}

function ScreenPanel({ idea, me }: { idea: Idea; me: User }) {
  const [checks, setChecks] = useState({ complete: true, eligible: true, documents: idea.attachments.length > 0 });
  const [note, setNote] = useState('');
  const labels: Record<string, string> = { complete: 'All required answers are meaningful', eligible: 'Meets the eligibility rules', documents: 'Documents are present and readable' };
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center gap-2 text-sm font-bold"><ShieldAlert size={16} className="text-brand" /> Level 1: screening</div>
      {Object.entries(checks).map(([k, v]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />{labels[k]}</label>)}
      <textarea className="field min-h-16" placeholder="Note to the innovator (needed if returning)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Screening note" />
      <Button className="w-full" onClick={() => attempt(() => screen(me, idea.id, checks, note), Object.values(checks).every(Boolean) ? 'Passed screening; reviewers assigned' : 'Returned to innovator')}>
        {Object.values(checks).every(Boolean) ? 'Pass and assign reviewers' : 'Return to innovator'}
      </Button>
    </div>
  );
}

function Assignments({ idea, s }: { idea: Idea; s: State }) {
  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-bold">Level 2: reviewers</div>
      <ul className="space-y-2">{idea.assignments.map((a) => {
        const u = s.users.find((x) => x.id === a.reviewerId);
        const done = idea.reviews.some((r) => r.reviewerId === a.reviewerId && r.round === idea.round);
        const overdue = !done && new Date(a.dueAt).getTime() < Date.now();
        return <li key={a.reviewerId} className="flex items-center gap-2 text-sm"><Avatar name={u?.name ?? '?'} size={24} /><span className="flex-1">{u?.name}</span>{a.conflict?.declared ? <Badge tone="rose">Conflict</Badge> : done ? <Badge tone="emerald">Scored</Badge> : overdue ? <Badge tone="rose">Overdue</Badge> : <Badge>Due {fmtDate(a.dueAt, { day: 'numeric', month: 'short' })}</Badge>}</li>;
      })}</ul>
    </div>
  );
}

function CommitteePanel({ idea, c, me, s }: { idea: Idea; c: Campaign; me: User; s: State }) {
  const [rationale, setRationale] = useState('');
  const votes = idea.decision?.votes ?? {};
  const mine = votes[me.id];
  const sc = ideaScore(s, idea);
  const counts = { approve: 0, revise: 0, decline: 0 } as Record<string, number>;
  Object.values(votes).forEach((v) => counts[v]!++);
  const canDecide = can(s, me, 'idea.decide');
  const quorum = Object.keys(votes).length >= c.levels.committeeQuorum;
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center gap-2 text-sm font-bold"><Flag size={16} className="text-brand" /> Level 3: committee</div>
      {sc.disagreement && <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> Reviewers disagree by {sc.spread} points. Discuss before voting.</div>}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        {(['approve', 'revise', 'decline'] as const).map((k) => <div key={k} className="rounded-xl bg-paper p-2"><div className="font-display text-xl font-extrabold">{counts[k]}</div><div className="text-xs capitalize text-muted">{k}</div></div>)}
      </div>
      <p className="text-xs text-muted">{Object.keys(votes).length} of {c.levels.committeeQuorum} votes needed for quorum.</p>
      {canDecide ? (<>
        <div className="grid grid-cols-3 gap-1.5">
          {(['approve', 'revise', 'decline'] as const).map((k) => (
            <button key={k} onClick={() => attempt(() => castVote(me, idea.id, k), `Vote recorded: ${k}`)} className={`rounded-xl border px-2 py-2 text-sm font-semibold capitalize ${mine === k ? 'border-brand bg-brand text-brand-ink' : 'border-line hover:border-ink/30'}`}>{k}</button>
          ))}
        </div>
        {!quorum && <Button variant="secondary" size="sm" className="w-full" onClick={() => {
          // demo helper: other members vote the way the calibrated score suggests
          const others = s.users.filter((u) => can(s, u, 'idea.decide') && u.id !== me.id && !votes[u.id]).slice(0, c.levels.committeeQuorum - Object.keys(votes).length - (mine ? 0 : 1));
          others.forEach((u) => castVote(u, idea.id, (sc.calibrated ?? 0) >= 65 ? 'approve' : (sc.calibrated ?? 0) >= 50 ? 'revise' : 'decline'));
        }}>Demo: other members vote</Button>}
        {me.role === 'adjudicator' && me.title?.startsWith('Chair') && (
          <div className="space-y-2 border-t border-line pt-3">
            <Field label="Decision reason (shared with innovator)" htmlFor="rat"><textarea id="rat" className="field min-h-20" value={rationale} onChange={(e) => setRationale(e.target.value)} /></Field>
            <div className="grid grid-cols-3 gap-1.5">
              <Button size="sm" disabled={!quorum} onClick={() => attempt(() => finaliseDecision(me, idea.id, 'approve', rationale), 'Approved')}>Approve</Button>
              <Button size="sm" variant="secondary" disabled={!quorum} onClick={() => attempt(() => finaliseDecision(me, idea.id, 'revise', rationale), 'Returned for revision')}>Revise</Button>
              <Button size="sm" variant="danger" disabled={!quorum} onClick={() => attempt(() => finaliseDecision(me, idea.id, 'decline', rationale), 'Declined')}>Decline</Button>
            </div>
          </div>
        )}
      </>) : <p className="text-sm text-muted">{can(s, me, 'idea.screen') ? 'Committee members vote here; administrators can follow along.' : 'Read-only: votes and outcome are visible to observers.'}</p>}
      {can(s, me, 'idea.screen') && <ReturnBox idea={idea} me={me} />}
    </div>
  );
}

function ReturnBox({ idea, me }: { idea: Idea; me: User }) {
  const [m, setM] = useState('');
  return (
    <details className="text-sm"><summary className="cursor-pointer font-semibold text-brand">Return for revision without a vote</summary>
      <textarea className="field mt-2 min-h-16" value={m} onChange={(e) => setM(e.target.value)} placeholder="What needs to change?" />
      <Button size="sm" variant="secondary" className="mt-2" onClick={() => attempt(() => returnForRevision(me, idea.id, m), 'Returned with feedback')}>Return</Button>
    </details>
  );
}

function AwardPanel({ idea, c, me }: { idea: Idea; c: Campaign; me: User }) {
  const ask = Math.min(Number(idea.answers.ask ?? c.maxAward) || 0, c.maxAward || 0);
  const [amount, setAmount] = useState(ask);
  const plan = (amt: number) => {
    const t = Math.round(amt / 4 / 1000) * 1000;
    return [
      { title: 'Bank account, mentor and milestone agreement signed', due: new Date(Date.now() + 14 * DAY).toISOString(), tranche: t },
      { title: 'Working pilot with first customers', due: new Date(Date.now() + 60 * DAY).toISOString(), tranche: t },
      { title: 'First break-even month', due: new Date(Date.now() + 120 * DAY).toISOString(), tranche: t },
      { title: 'Scale to a second district', due: new Date(Date.now() + 180 * DAY).toISOString(), tranche: amt - 3 * t },
    ];
  };
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center gap-2 text-sm font-bold"><Award size={16} className="text-accent" /> Confirm award</div>
      {c.maxAward > 0 ? <Field label={`Amount (max ${pula(c.maxAward)})`} htmlFor="amt"><input id="amt" type="number" className="field" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field> : <p className="text-sm text-muted">Recognition award (no cash).</p>}
      {c.maxAward > 0 && <ul className="space-y-1 text-xs text-muted">{plan(amount).map((m) => <li key={m.title}>• {m.title}: {pula(m.tranche)}</li>)}</ul>}
      <Button className="w-full" onClick={() => attempt(() => confirmAward(me, idea.id, c.maxAward ? amount : 0, c.maxAward ? plan(amount) : [{ title: 'Pilot the idea with an executive sponsor', due: new Date(Date.now() + 60 * DAY).toISOString(), tranche: 0 }]), 'Award confirmed; milestone plan created')}>Confirm award & milestone plan</Button>
    </div>
  );
}

function AwardCard({ idea }: { idea: Idea }) {
  return (
    <div className="card overflow-hidden">
      <div className="furrows bg-accent-soft p-4">
        <div className="flex items-center gap-2 text-sm font-bold"><Award size={16} /> Award certificate</div>
        <div className="mt-2 font-display text-2xl font-extrabold">{idea.award!.amount ? pula(idea.award!.amount) : 'Recognised'}</div>
        <div className="text-xs text-muted">Confirmed {fmtDate(idea.award!.at)}</div>
      </div>
      <div className="p-4 text-sm">Verification code <code className="font-bold">{idea.award!.code}</code><Link to="/verify" className="mt-1 block text-xs font-semibold text-brand">Anyone can verify it →</Link></div>
    </div>
  );
}
