import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { BellRing, Search, Lock } from 'lucide-react';
import { useStore, Button, PageHeader, StageTrack, StatusBadge, Empty, attempt, Field } from '../../ui/kit';
import { STATUS_META } from '../../core/workflow';
import { fmtDateTime } from '../../core/util';
import { subscribeAlerts } from '../../core/actions';

export default function Track() {
  const { ref } = useParams();
  const nav = useNavigate();
  const s = useStore();
  const [q, setQ] = useState(ref ?? '');
  const [contact, setContact] = useState('');
  const idea = ref ? s.ideas.find((i) => i.ref.toLowerCase() === ref.toLowerCase() && i.status !== 'draft') : undefined;
  const c = idea && s.campaigns.find((x) => x.id === idea.campaignId);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader eyebrow="Public tracker" title="Where is my idea?" sub="Enter the reference on your receipt (for example LTS-26-0101). No sign-in needed." />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); nav(`/track/${q.trim().toUpperCase()}`); }}>
        <input className="field font-mono uppercase" value={q} onChange={(e) => setQ(e.target.value)} placeholder="LTS-26-0101" aria-label="Reference number" />
        <Button type="submit"><Search size={16} /> Track</Button>
      </form>
      {ref && !idea && <div className="mt-6"><Empty title={`No submitted idea with reference ${ref}`}>Check the reference on your receipt email or SMS.</Empty></div>}
      {idea && c && (
        <div className="mt-8 space-y-5">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-sm text-muted">{idea.ref}</div>
                <h2 className="mt-1 text-xl font-bold">{idea.showcase ? idea.title : <span className="inline-flex items-center gap-1.5 text-muted"><Lock size={16} /> Title kept private</span>}</h2>
                <div className="text-sm text-muted">{c.title}</div>
              </div>
              <StatusBadge status={idea.status} />
            </div>
            <div className="mt-6"><StageTrack idea={idea} /></div>
            <p className="mt-5 rounded-xl bg-paper p-3 text-sm"><b>What happens next:</b> {STATUS_META[idea.status].next}</p>
          </div>
          <div className="card p-6">
            <h3 className="font-bold">Timeline</h3>
            <ol className="mt-4 space-y-3 border-l-2 border-line pl-5">
              {[...idea.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${i === 0 ? 'bg-brand ring-4 ring-brand-soft' : 'bg-line'}`} />
                  <div className="text-sm font-semibold">{STATUS_META[h.status].label}</div>
                  <div className="text-xs text-muted">{fmtDateTime(h.at)}</div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-bold"><BellRing size={18} className="text-brand" /> Get free alerts</h3>
            <p className="mt-1 text-sm text-muted">We will message you each time this idea changes stage. Free of charge; reply STOP to end.</p>
            <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (attempt(() => subscribeAlerts(idea.ref, contact), 'Alerts on. Check the demo inbox for the confirmation.') !== undefined) setContact(''); }}>
              <div className="min-w-60 flex-1"><Field label="Email or mobile number" htmlFor="alert-contact"><input id="alert-contact" className="field" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or +267 71 234 567" /></Field></div>
              <Button type="submit">Subscribe</Button>
            </form>
            <p className="mt-2 text-xs text-muted">{idea.watchers.length} subscriber{idea.watchers.length === 1 ? '' : 's'}. In this demo, messages appear in the <Link to="/inbox" className="underline">demo inbox</Link>.</p>
          </div>
        </div>
      )}
    </div>
  );
}
