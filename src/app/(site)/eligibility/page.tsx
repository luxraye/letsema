import Link from 'next/link';
import { liveInstances } from '@/lib/queries';
import { acceptingEntries } from '@/lib/instances';
import { fmtDate } from '@/lib/format';
import { SECTORS } from '@/lib/catalogue';
import { PageHeader } from '@/components/ui';
import { CompetitionFinder } from '@/components/competition-finder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Which competitions can I enter?' };

const ENTRY_KEYS = ['apply', 'register', 'build', 'submit'];

/**
 * There is no such thing as being "eligible for the portal": anyone can make an account.
 * Each competition sets its own entry rules, so this page checks your answers against every open one.
 */
export default async function Eligibility() {
  const open = (await liveInstances()).filter((x) => acceptingEntries(x.i.definition, x.i.status));
  const comps = open.map(({ i, space }) => {
    const entry = i.definition.stages.filter((s) => ENTRY_KEYS.includes(s.key)).at(-1);
    return { slug: i.slug, name: i.name, tagline: i.tagline, space: space.short, closes: fmtDate(entry?.ends ?? i.closesAt), def: i.definition };
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader eyebrow="Takes a minute" title="Which competitions can I enter?" sub="Anyone can create an account. Each competition then sets its own rules, such as age, citizenship, business stage or sector. Answer a few questions and see where you qualify." />
      {comps.length ? <CompetitionFinder comps={comps} sectors={SECTORS} /> : <p className="card p-6 text-sm">No competitions are taking entries right now. <Link href="/instances" className="font-semibold underline">See upcoming competitions</Link>.</p>}
      <p className="mt-6 text-xs text-muted">Only competitions taking entries today are shown. <Link href="/instances" className="underline">See every competition</Link>, including closed ones.</p>
    </div>
  );
}
