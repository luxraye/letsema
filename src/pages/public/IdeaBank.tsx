import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Heart, Search, MapPin } from 'lucide-react';
import { useStore, PageHeader, Badge, StatusBadge, Empty } from '../../ui/kit';
import { cheer } from '../../core/actions';
import { pula } from '../../core/util';

export default function IdeaBank() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const shown = s.ideas.filter((i) => i.showcase);
  const sectors = [...new Set(shown.map((i) => i.sector))].sort();
  const list = useMemo(() => shown.filter((i) => (!sector || i.sector === sector) && (!q || `${i.title} ${i.summary} ${i.district}`.toLowerCase().includes(q.toLowerCase()))), [shown, q, sector]);
  const [cheered, setCheered] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('letsema:cheered') ?? '[]'); } catch { return []; } });
  const doCheer = (id: string) => { if (cheered.includes(id)) return; cheer(id); const n = [...cheered, id]; setCheered(n); try { localStorage.setItem('letsema:cheered', JSON.stringify(n)); } catch { /* */ } };
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Idea bank" title="Ideas CEDA has backed" sub="A public record of awarded ideas, shared with the innovators’ consent. Other submissions stay private to their owners and evaluators." />
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1"><Search size={16} className="absolute left-3 top-3 text-muted" /><input className="field pl-9" placeholder="Search by keyword or town" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search ideas" /></div>
        <select className="field w-auto" value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Sector"><option value="">All sectors</option>{sectors.map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => {
          const c = s.campaigns.find((x) => x.id === i.campaignId)!;
          const verified = i.milestones.filter((m) => m.status === 'verified').length;
          return (
            <article key={i.id} className="card flex flex-col p-5">
              <div className="flex items-center justify-between gap-2"><Badge>{i.sector}</Badge><StatusBadge status={i.status} /></div>
              <h2 className="mt-3 text-lg font-bold">{i.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{i.summary}</p>
              <div className="mt-3 text-xs text-muted"><MapPin size={12} className="inline" /> {i.district} · {c.title}</div>
              {i.milestones.length > 0 && (
                <div className="mt-3"><div className="mb-1 flex justify-between text-xs"><span>Milestones</span><span>{verified}/{i.milestones.length}</span></div><div className="h-1.5 rounded-full bg-line"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${(verified / i.milestones.length) * 100}%` }} /></div></div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                {i.award?.amount ? <span className="text-sm font-bold">{pula(i.award.amount)}</span> : <span className="text-sm text-muted">Recognised</span>}
                <div className="flex items-center gap-2">
                  <Link to={`/track/${i.ref}`} className="text-sm font-semibold text-brand">Track</Link>
                  <button onClick={() => doCheer(i.id)} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm ${cheered.includes(i.id) ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-line hover:bg-ink/5'}`} aria-pressed={cheered.includes(i.id)} aria-label="Cheer this idea"><Heart size={14} /> {i.cheers}</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!list.length && <Empty title="No ideas match">Try another keyword.</Empty>}
    </div>
  );
}
