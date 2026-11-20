import Link from 'next/link';
import { liveInstances } from '@/lib/queries';
import { PageHeader } from '@/components/ui';
import { EligibilityChecker } from '@/components/eligibility-checker';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Am I eligible?' };

export default async function Eligibility({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const list = (await liveInstances()).filter((x) => x.i.status === 'live');
  const { c } = await searchParams;
  const chosen = list.find((x) => x.i.slug === c) ?? list[0];
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="30 seconds" title="Am I eligible?" sub="Pick a competition and answer a few questions. Nothing is saved." />
      <div className="mb-5 flex flex-wrap gap-2">{list.map((x) => <Link key={x.i.slug} href={`/eligibility?c=${x.i.slug}`} className={`chip border !py-1.5 ${x.i.slug === chosen?.i.slug ? 'border-ink bg-ink text-white' : 'border-line bg-surface'}`}>{x.i.name}</Link>)}</div>
      {chosen && <EligibilityChecker key={chosen.i.slug} def={chosen.i.definition} />}
      {chosen && <p className="mt-4 text-sm"><Link className="font-semibold text-[var(--brand)]" href={`/i/${chosen.i.slug}`}>Read the full rules for {chosen.i.name} →</Link></p>}
    </div>
  );
}
