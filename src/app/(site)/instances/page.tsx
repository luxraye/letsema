import { liveInstances } from '@/lib/queries';
import { InstanceCard } from '@/components/instance-card';
import { PageHeader, Notice } from '@/components/ui';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Open competitions' };

export default async function Instances({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const me = await currentUser();
  const { space } = await searchParams;
  const all = await liveInstances(me?.organisation === 'CEDA' || (me ? me.role !== 'innovator' : false));
  const rows = space ? all.filter((x) => x.space.slug === space) : all;
  const spaces = [...new Map(all.map((x) => [x.space.slug, x.space])).values()];
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Programmable and tamper-evident challenges" title="CEDA Innovation Challenges" sub="Take part in national funding calls, software hackathons and sector accelerators. Every competition runs on its own Instance, with published rules sealed by a fingerprint." />
      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/instances" className={`chip border ${!space ? 'border-ink bg-ink text-white' : 'border-line bg-surface'}`}>All</a>
        {spaces.map((s) => <a key={s.slug} href={`/instances?space=${s.slug}`} className={`chip border ${space === s.slug ? 'border-ink bg-ink text-white' : 'border-line bg-surface'}`}>{s.short}</a>)}
      </div>
      <div className="mb-6"><Notice>Demo data: BDIH and BTC are illustrative partner spaces; entries and people are fictional.</Notice></div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rows.map((x) => <InstanceCard key={x.i.id} x={x} />)}</div>
    </div>
  );
}
