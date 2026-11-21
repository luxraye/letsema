import { liveInstances } from '@/lib/queries';
import { InstanceCard } from '@/components/instance-card';
import { PageHeader, Notice } from '@/components/ui';
import { currentUser } from '@/lib/session';
import { SECTORS } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Open competitions' };

export default async function Instances({ searchParams }: { searchParams: Promise<{ space?: string; sector?: string }> }) {
  const me = await currentUser();
  const { space, sector: rawSector } = await searchParams;
  const sector = rawSector && SECTORS.includes(rawSector) ? rawSector : undefined;
  const all = await liveInstances(me?.organisation === 'CEDA' || (me ? me.role !== 'innovator' : false));
  const rows = all.filter((x) => (!space || x.space.slug === space) && (!sector || x.i.definition.sectors.includes(sector)));
  const q = (o: { space?: string; sector?: string }) => { const u = new URLSearchParams(); if (o.space) u.set('space', o.space); if (o.sector) u.set('sector', o.sector); const t = u.toString(); return t ? `/instances?${t}` : '/instances'; };
  const on = 'border-[var(--brand)] bg-[var(--brand)] text-white', off = 'border-line bg-surface hover:border-[var(--brand)]/50';
  const spaces = [...new Map(all.map((x) => [x.space.slug, x.space])).values()];
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Programmable and tamper-evident challenges" title={sector ? `Competitions open to ${sector}` : 'CEDA Innovation Challenges'} sub={sector ? `Every live or recently closed competition that accepts ${sector.toLowerCase()} ideas. Pick another sector or clear the filter to see them all.` : 'Take part in national funding calls, software hackathons and sector accelerators. Every competition runs on its own Instance, with published rules sealed by a fingerprint.'} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted">Run by</span>
        <a href={q({ sector })} className={`chip border transition ${!space ? on : off}`}>All</a>
        {spaces.map((s) => <a key={s.slug} href={q({ space: s.slug, sector })} className={`chip border transition ${space === s.slug ? on : off}`}>{s.short}</a>)}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted">Sector</span>
        <a href={q({ space })} className={`chip border transition ${!sector ? on : off}`}>All sectors</a>
        {SECTORS.map((x) => <a key={x} href={q({ space, sector: x })} className={`chip border transition ${sector === x ? on : off}`}>{x}</a>)}
      </div>
      <div className="mb-6"><Notice>Demo data: BDIH and BTC are illustrative partner spaces; entries and people are fictional.</Notice></div>
      {rows.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rows.map((x) => <InstanceCard key={x.i.id} x={x} />)}</div> : <div className="card p-8 text-center"><div className="font-bold">No competition is open to this sector right now.</div><p className="mt-1 text-sm text-muted">New competitions open through the year. Check back, or look at what is open in other sectors.</p><a href="/instances" className="btn-primary mt-4">See every competition</a></div>}
    </div>
  );
}
