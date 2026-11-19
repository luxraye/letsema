import { Link } from 'react-router';
import { Lightbulb, Plus } from 'lucide-react';
import { useMe, useStore, PageHeader, LinkButton, StageTrack, StatusBadge, Empty } from '../../ui/kit';
import { STATUS_META } from '../../core/workflow';
import { ago } from '../../core/util';

export default function MyIdeas() {
  const me = useMe()!;
  const s = useStore();
  const mine = s.ideas.filter((i) => i.ownerId === me.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div>
      <PageHeader title="My ideas" sub="Everything you have started or submitted, and what happens next." actions={<LinkButton to="/app/ideas/new"><Plus size={16} /> New idea</LinkButton>} />
      <div className="space-y-3">
        {mine.map((i) => {
          const c = s.campaigns.find((x) => x.id === i.campaignId)!;
          const unread = i.thread.filter((m) => m.visibility === 'shared' && m.authorId !== me.id).length;
          return (
            <Link key={i.id} to={i.status === 'draft' ? `/app/ideas/${i.id}/edit` : `/app/ideas/${i.id}`} className="card block p-5 transition hover:border-brand">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><div className="text-xs text-muted"><span className="font-mono">{i.ref}</span> · {c.title} · updated {ago(i.updatedAt)}</div><div className="mt-0.5 text-lg font-bold">{i.title || 'Untitled draft'}</div></div>
                <StatusBadge status={i.status} />
              </div>
              {i.status !== 'draft' && <div className="mt-4"><StageTrack idea={i} /></div>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm"><span className={i.status === 'revision' ? 'font-semibold text-amber-800' : 'text-muted'}>{STATUS_META[i.status].next}</span>{unread > 0 && <span className="text-xs font-semibold text-brand">{unread} feedback message{unread > 1 ? 's' : ''}</span>}</div>
            </Link>
          );
        })}
        {!mine.length && <Empty icon={<Lightbulb />} title="No ideas yet"><Link to="/calls" className="text-brand underline">Find an open call</Link> and start your first one. It saves as you type.</Empty>}
      </div>
    </div>
  );
}
