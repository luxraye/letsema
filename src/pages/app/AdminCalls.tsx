import { Link, useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { useMe, useStore, PageHeader, Button, Badge } from '../../ui/kit';
import { saveCampaign, attemptSave } from './callFactory';
import { fmtDate } from '../../core/util';

export default function AdminCalls() {
  const me = useMe()!;
  const s = useStore();
  const nav = useNavigate();
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Calls & application forms" sub="Create a call without a developer: dates, eligibility, the application form, required documents, criteria and weights, and how many evaluation levels it uses."
        actions={<Button onClick={() => { const c = attemptSave(me); if (c) nav(`/app/admin/calls/${c}`); }}><Plus size={16} /> New call</Button>} />
      <div className="card divide-y divide-line">
        {s.campaigns.map((c) => (
          <Link key={c.id} to={`/app/admin/calls/${c.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-ink/5">
            <span className="h-8 w-1.5 rounded-full" style={{ background: `oklch(0.6 0.13 ${c.hue})` }} />
            <div className="min-w-0 flex-1"><div className="font-semibold">{c.title}</div><div className="text-xs text-muted">{c.host} · {fmtDate(c.opens)} – {fmtDate(c.closes)} · {c.form.length} questions · {c.criteria.length} criteria</div></div>
            <Badge tone={c.track === 'staff' ? 'accent' : c.track === 'partner' ? 'violet' : 'brand'}>{c.track}</Badge>
            <Badge tone={c.status === 'open' ? 'emerald' : c.status === 'draft' ? 'slate' : c.status === 'reviewing' ? 'violet' : 'slate'}>{c.status}</Badge>
            <span className="text-sm text-muted">{s.ideas.filter((i) => i.campaignId === c.id && i.status !== 'draft').length} entries</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
export { saveCampaign };
