import { useState } from 'react';
import { useStore, PageHeader, Tabs, Empty } from '../../ui/kit';
import { CallCard } from './Home';
import { useMe } from '../../ui/kit';

export default function Calls() {
  const s = useStore();
  const me = useMe();
  const [tab, setTab] = useState<'open' | 'reviewing' | 'closed' | 'staff'>('open');
  const list = s.campaigns.filter((c) => c.status !== 'draft').filter((c) =>
    tab === 'staff' ? c.track === 'staff' : c.track !== 'staff' && (tab === 'open' ? c.status === 'open' : tab === 'reviewing' ? c.status === 'reviewing' : c.status === 'closed'),
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Calls for ideas" title="Find a call that fits your idea" sub="Each call publishes its rules, criteria and weights up front, so you know exactly how you will be judged." />
      <Tabs value={tab} onChange={setTab} items={[{ key: 'open', label: 'Open now' }, { key: 'reviewing', label: 'Under review' }, { key: 'closed', label: 'Closed' }, { key: 'staff', label: 'CEDA staff' }]} />
      {tab === 'staff' && !me?.staff && <p className="mt-3 text-sm text-muted">Staff campaigns are visible to everyone for transparency, but only CEDA employees can enter.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((c) => <CallCard key={c.id} c={c} count={s.ideas.filter((i) => i.campaignId === c.id && i.status !== 'draft').length} />)}
      </div>
      {!list.length && <div className="mt-6"><Empty title="No calls here right now">Check back soon or subscribe to alerts from your profile.</Empty></div>}
    </div>
  );
}
