'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import type { InstanceDefinition } from '@/db/schema';
import { checkEligibility } from '@/lib/eligibility';
import { EMPTY_ANSWERS, Questions, ReasonList, neededQuestions, toAnswers, type RawAnswers } from './eligibility-checker';

type Comp = { slug: string; name: string; tagline: string; space: string; closes: string; def: InstanceDefinition };

/** Answer once, see every open competition you can enter. Each one is judged by its own rules. */
export function CompetitionFinder({ comps, sectors }: { comps: Comp[]; sectors: string[] }) {
  const [a, setA] = useState<RawAnswers>(EMPTY_ANSWERS);
  const ans = toAnswers(a);
  const rows = comps.map((c) => ({ c, v: checkEligibility(c.def, ans) }))
    .map((r) => ({ ...r, state: r.v.reasons.some((x) => !x.ok && !x.unknown) ? 'no' : r.v.reasons.some((x) => x.unknown) ? 'maybe' : 'yes' } as const));
  const order = { yes: 0, maybe: 1, no: 2 };
  rows.sort((x, y) => order[x.state] - order[y.state]);
  const yes = rows.filter((r) => r.state === 'yes').length;
  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside className="card h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-bold">About you</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Answer what you can. Each competition below checks only its own rules.</p>
        <Questions a={a} setA={setA} need={neededQuestions(comps.map((c) => c.def))} sectors={sectors} />
        <button type="button" onClick={() => setA(EMPTY_ANSWERS)} className="mt-4 text-xs font-semibold text-muted underline">Clear my answers</button>
        <p className="mt-3 text-xs text-muted">Nothing you type here is saved or sent.</p>
      </aside>
      <div>
        <p aria-live="polite" className="mb-3 text-sm font-semibold">{yes ? `You can enter ${yes} of ${comps.length} open competitions.` : `${comps.length} open competitions, each with its own rules.`}</p>
        <ul className="space-y-3">
          {rows.map(({ c, v, state }) => (
            <li key={c.slug} data-comp={c.slug} data-state={state} className={`card p-5 transition ${state === 'no' ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">{c.space}</div>
                  <h3 className="text-lg font-bold">{c.name}</h3>
                  <p className="text-sm text-muted">{c.tagline}</p>
                </div>
                <span className={`chip shrink-0 ${state === 'yes' ? 'bg-emerald-100 text-emerald-900' : state === 'no' ? 'bg-rose-100 text-rose-900' : 'bg-sand text-muted'}`}>{state === 'yes' ? 'You can enter' : state === 'no' ? 'Not open to you' : 'Answer to check'}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div><div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Who can enter</div>{v.reasons.length ? <ReasonList reasons={v.reasons} /> : <p className="text-sm">Anyone with a free account.</p>}</div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted"><CalendarClock size={13} /> Closes {c.closes}</span>
                  <Link href={`/i/${c.slug}`} className={state === 'yes' ? 'btn-primary !py-2 text-sm' : 'btn-ghost !py-2 text-sm'}>{state === 'yes' ? 'See it and apply' : 'See the competition'} <ArrowRight size={14} /></Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
