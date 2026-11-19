import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { EyeOff, ShieldCheck, ShieldX, Paperclip } from 'lucide-react';
import { useMe, useStore, Button, Empty, PageHeader, Field, attempt, Badge, Tip } from '../../ui/kit';
import { declareConflict, submitReview } from '../../core/actions';
import { reviewTotal } from '../../core/scoring';

const LEVELS = ['Very weak', 'Weak', 'Adequate', 'Good', 'Excellent'];

export default function ReviewIdea() {
  const { id } = useParams();
  const me = useMe()!;
  const s = useStore();
  const nav = useNavigate();
  const idea = s.ideas.find((i) => i.id === id);
  const a = idea?.assignments.find((x) => x.reviewerId === me.id);
  const prev = idea?.reviews.filter((r) => r.reviewerId === me.id).sort((x, y) => y.round - x.round)[0];
  const [scores, setScores] = useState<Record<string, number>>(prev?.scores ?? {});
  const [comments, setComments] = useState<Record<string, string>>(prev?.comments ?? {});
  const [overall, setOverall] = useState(prev?.overall ?? '');
  const [rec, setRec] = useState<'advance' | 'revise' | 'decline'>(prev?.recommendation ?? 'advance');
  const [conflictNote, setConflictNote] = useState('');
  if (!idea || !a) return <Empty title="This idea is not assigned to you" />;
  const c = s.campaigns.find((x) => x.id === idea.campaignId)!;
  if (!a.conflict) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader eyebrow={idea.ref} title="Conflict of interest check" sub="Before the idea opens, confirm you have no personal, family, business or financial link to the team or their competitors." />
        <div className="card space-y-4 p-5">
          <p className="text-sm">You will see the idea <b>without</b> names, company or district. If you recognise it anyway, declare a conflict and it will be reassigned automatically.</p>
          <Button className="w-full" onClick={() => attempt(() => declareConflict(me, idea.id, false), 'Thanks. The idea is now open.')}><ShieldCheck size={16} /> I have no conflict of interest</Button>
          <div className="border-t border-line pt-4">
            <Field label="Or describe the conflict" htmlFor="cn"><textarea id="cn" className="field min-h-16" value={conflictNote} onChange={(e) => setConflictNote(e.target.value)} /></Field>
            <Button variant="secondary" className="mt-2 w-full" onClick={() => { if (attempt(() => declareConflict(me, idea.id, true, conflictNote), 'Conflict recorded. Idea reassigned.') !== undefined) nav('/app/review'); }}><ShieldX size={16} /> Declare a conflict</Button>
          </div>
        </div>
      </div>
    );
  }
  if (a.conflict.declared) return <Empty title="You declared a conflict on this idea">It has been reassigned.</Empty>;
  const locked = idea.status !== 'in_review';
  const preview = reviewTotal({ id: '', reviewerId: me.id, round: idea.round, scores, comments, overall, recommendation: rec, submittedAt: '' }, c);
  const prevVersion = idea.round > 1 ? idea.versions[idea.versions.length - 2] : undefined;
  return (
    <div>
      <div className="mb-2 text-sm"><Link to="/app/review" className="font-semibold text-brand">← Review queue</Link></div>
      <PageHeader eyebrow={`${idea.ref} · ${c.title}`} title={idea.title} sub={<span className="inline-flex items-center gap-1.5"><EyeOff size={15} /> Blind review: submitter details are hidden.</span>} actions={idea.round > 1 ? <Badge tone="amber">Resubmission: round {idea.round}</Badge> : undefined} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {prevVersion && <Tip><b>What the innovator changed:</b> {idea.versions[idea.versions.length - 1]!.note}. Your previous scores are pre-filled; adjust them if the changes address your feedback.</Tip>}
          <div className="card divide-y divide-line">
            <div className="p-4"><div className="text-sm font-semibold text-muted">Summary</div><p className="mt-1">{idea.summary}</p></div>
            {c.form.filter((f) => f.type !== 'checkbox' && f.type !== 'url').map((f) => {
              const changed = prevVersion && (prevVersion.answers[f.id] ?? '') !== (idea.answers[f.id] ?? '');
              return <div key={f.id} className={`p-4 ${changed ? 'bg-emerald-50/60' : ''}`}><div className="flex items-center gap-2 text-sm font-semibold text-muted">{f.label}{changed && <Badge tone="emerald">Changed</Badge>}</div><p className="mt-1 whitespace-pre-wrap">{idea.answers[f.id] || '—'}</p></div>;
            })}
            <div className="p-4"><div className="text-sm font-semibold text-muted">Documents</div>{idea.attachments.map((x) => <div key={x.id} className="mt-1 flex items-center gap-2 text-sm"><Paperclip size={14} />{x.name.replace(/LTS-\d+-\d+/, 'redacted')}</div>)}</div>
          </div>
        </div>
        <form className="card h-fit space-y-5 p-5 lg:sticky lg:top-20" onSubmit={(e) => { e.preventDefault(); if (attempt(() => submitReview(me, idea.id, { scores, comments, overall, recommendation: rec }), 'Review submitted') !== undefined) nav('/app/review'); }}>
          <div className="flex items-center justify-between"><h2 className="font-bold">Score each criterion</h2><span className="rounded-lg bg-brand-soft px-2 py-1 font-display font-extrabold text-brand tabular-nums">{preview} / 100</span></div>
          {c.criteria.map((cr) => (
            <fieldset key={cr.id} disabled={locked}>
              <legend className="text-sm font-semibold">{cr.name} <span className="font-normal text-muted">· weight {cr.weight}</span></legend>
              <p className="text-xs text-muted">{cr.description}</p>
              <div className="mt-2 grid grid-cols-5 gap-1" role="radiogroup" aria-label={cr.name}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button type="button" key={v} role="radio" aria-checked={scores[cr.id] === v} title={LEVELS[v - 1]} onClick={() => setScores({ ...scores, [cr.id]: v })}
                    className={`rounded-lg border py-1.5 text-sm font-bold ${scores[cr.id] === v ? 'border-brand bg-brand text-brand-ink' : 'border-line hover:border-ink/30'}`}>{v}</button>
                ))}
              </div>
              <div className="mt-1 text-xs text-muted">{scores[cr.id] ? LEVELS[scores[cr.id]! - 1] : 'Not scored'}</div>
              <textarea className="field mt-2 min-h-14 text-sm" placeholder="Why this score? The innovator will see this." value={comments[cr.id] ?? ''} onChange={(e) => setComments({ ...comments, [cr.id]: e.target.value })} aria-label={`Comment on ${cr.name}`} />
            </fieldset>
          ))}
          <Field label="Overall comment" htmlFor="ov"><textarea id="ov" className="field min-h-20" value={overall} onChange={(e) => setOverall(e.target.value)} disabled={locked} /></Field>
          <div>
            <div className="label">Recommendation</div>
            <div className="grid grid-cols-3 gap-1.5">{(['advance', 'revise', 'decline'] as const).map((r) => <button type="button" key={r} onClick={() => setRec(r)} disabled={locked} className={`rounded-xl border py-2 text-sm font-semibold capitalize ${rec === r ? 'border-brand bg-brand-soft' : 'border-line'}`}>{r === 'advance' ? 'To committee' : r}</button>)}</div>
          </div>
          {locked ? <p className="text-sm text-muted">This idea has moved on to {idea.status.replace('_', ' ')}; your review is locked.</p> : <Button type="submit" className="w-full">Submit review</Button>}
        </form>
      </div>
    </div>
  );
}
