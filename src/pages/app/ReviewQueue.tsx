import { Link } from 'react-router';
import { ClipboardCheck, Clock } from 'lucide-react';
import { useMe, useStore, PageHeader, Badge, Empty, Stat } from '../../ui/kit';
import { reviewerStats, globalStats } from '../../core/scoring';
import { fmtDate } from '../../core/util';

export default function ReviewQueue() {
  const me = useMe()!;
  const s = useStore();
  const mine = s.ideas.filter((i) => i.assignments.some((a) => a.reviewerId === me.id));
  const todo = mine.filter((i) => i.status === 'in_review' && !i.assignments.find((a) => a.reviewerId === me.id)?.conflict?.declared && !i.reviews.some((r) => r.reviewerId === me.id && r.round === i.round));
  const done = mine.filter((i) => i.reviews.some((r) => r.reviewerId === me.id));
  const st = reviewerStats(s).get(me.id);
  const g = globalStats(s);
  const delta = st ? st.mean - g.mean : 0;
  return (
    <div>
      <PageHeader eyebrow="Reviewer" title="Your review queue" sub="Ideas are shown without the submitter’s name, company or district. Declare any conflict before you open one." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="To score" value={todo.length} icon={<ClipboardCheck size={16} />} />
        <Stat label="Scored so far" value={done.length} />
        <Stat label="Your marking vs panel" value={st && st.n >= 3 ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}` : '—'} hint={st && st.n >= 3 ? (Math.abs(delta) < 3 ? 'You mark close to the panel average' : delta > 0 ? 'You mark more generously; calibration adjusts for this' : 'You mark more strictly; calibration adjusts for this') : 'Shown after 3 reviews'} />
      </div>
      <div className="space-y-3">
        {todo.map((i) => {
          const a = i.assignments.find((x) => x.reviewerId === me.id)!;
          const c = s.campaigns.find((x) => x.id === i.campaignId)!;
          const overdue = new Date(a.dueAt).getTime() < Date.now();
          return (
            <Link key={i.id} to={`/app/review/${i.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition hover:border-brand">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><span className="font-mono">{i.ref}</span>· {c.title} {i.round > 1 && <Badge tone="amber">Resubmitted: round {i.round}</Badge>}</div>
                <div className="mt-0.5 font-semibold">{i.title}</div>
                <div className="text-sm text-muted">{i.sector}</div>
              </div>
              <Badge tone={overdue ? 'rose' : 'slate'}><Clock size={12} /> {overdue ? 'Overdue' : `Due ${fmtDate(a.dueAt, { day: 'numeric', month: 'short' })}`}</Badge>
              <Badge tone={a.conflict ? 'emerald' : 'amber'}>{a.conflict ? 'No conflict declared' : 'Declare conflict first'}</Badge>
            </Link>
          );
        })}
        {!todo.length && <Empty icon={<ClipboardCheck />} title="You are all caught up">New assignments appear here and you will be notified.</Empty>}
      </div>
      {done.length > 0 && (<>
        <h2 className="mb-3 mt-10 text-lg font-bold">Already scored</h2>
        <div className="card divide-y divide-line">{done.map((i) => <Link key={i.id} to={`/app/review/${i.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-ink/5"><span><span className="font-mono text-muted">{i.ref}</span> {i.title}</span><Badge>{i.status.replace('_', ' ')}</Badge></Link>)}</div>
      </>)}
    </div>
  );
}
