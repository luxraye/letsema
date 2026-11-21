import Image from 'next/image';
import { Target, Users, Venus } from 'lucide-react';
import { pula } from '@/lib/instances';

/* ---------- SDGs 2030 ---------- */

type Metrics = { womenPct: number; awarded: number; awardedSum: number; live: number; districts: number };

/** UN goal numbers in their official colours, with what the portal does for each and a live figure. */
export function SdgGoals({ m }: { m: Metrics }) {
  const goals = [
    { n: 5, name: 'Gender equality', colour: '#FF3A21', does: 'Optional gender reporting shows how many women apply, and a scoring rubric that is blind to names.', stat: `Women are ${m.womenPct}% of innovators; the goal is 50%` },
    { n: 8, name: 'Decent work and economic growth', colour: '#A21942', does: 'Funding goes to citizen-owned ventures that hire locally, with youth ownership checked at entry.', stat: `${pula(m.awardedSum)} awarded to ${m.awarded} ventures` },
    { n: 9, name: 'Industry, innovation and infrastructure', colour: '#FD6925', does: 'One digital front door for every CEDA call, hackathon and accelerator, set up with no code.', stat: `${m.live} competitions open now` },
    { n: 10, name: 'Reduced inequalities', colour: '#DD1367', does: 'Apply from a cheap phone, track by SMS or dial *161# with no data, in English or Setswana.', stat: `Applications from ${m.districts} districts` },
    { n: 17, name: 'Partnerships for the goals', colour: '#19486A', does: 'Partner organisations run their own competitions on the same fair, audited rules.', stat: 'One set of rules and one audit trail for every partner' },
  ];
  return (
    <section className="border-t border-line py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mb-10 max-w-2xl">
          <span className="eyebrow">Sustainable Development Goals 2030</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">Built Around the 2030 Goals</h2>
          <p className="mt-2 text-muted">Botswana has signed up to the UN Sustainable Development Goals. This portal supports five of them directly, and tracks progress as people use it.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {goals.map((g) => (
            <article key={g.n} className="card reveal flex flex-col overflow-hidden p-0">
              <div className="flex items-center gap-3 p-4 text-white" style={{ background: g.colour }}>
                <span className="font-display text-4xl font-extrabold leading-none">{g.n}</span>
                <span className="text-[13px] font-bold uppercase leading-tight tracking-wide">{g.name}</span>
              </div>
              <p className="flex-1 p-4 text-sm text-muted">{g.does}</p>
              <p className="mx-4 mb-4 rounded-xl bg-sand px-3 py-2 text-[13px] font-semibold text-fg">{g.stat}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Figures update live from the portal. Demo data is fictional.</p>
      </div>
    </section>
  );
}

/* ---------- Inclusion donuts ---------- */

type Slice = { label: string; value: number; colour: string };

/** Donut with a 2px gap between slices, a hover title per slice, a legend and a table view. */
function Donut({ title, slices, centre, centreSub, id }: { title: string; slices: Slice[]; centre: string; centreSub: string; id: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const R = 52, C = 2 * Math.PI * R, GAP = 2;
  let at = 0;
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <figure className="card reveal flex flex-col p-5 sm:p-6" aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="font-bold">{title}</figcaption>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative size-44 shrink-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`${title}: ${slices.map((s) => `${s.label} ${pct(s.value)}%`).join(', ')}`}>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--t-line)" strokeWidth="14" />
            {slices.filter((s) => s.value > 0).map((s) => {
              const len = (s.value / total) * C;
              const el = (
                <circle key={s.label} cx="60" cy="60" r={R} fill="none" stroke={s.colour} strokeWidth="14" strokeDasharray={`${Math.max(len - GAP, 0.5)} ${C}`} strokeDashoffset={-at} className="transition-[stroke-width] duration-200 hover:[stroke-width:17]">
                  <title>{`${s.label}: ${pct(s.value)}%`}</title>
                </circle>
              );
              at += len;
              return el;
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <span><span className="font-display block text-3xl font-extrabold">{centre}</span><span className="block text-[11px] leading-tight text-muted">{centreSub}</span></span>
          </div>
        </div>
        <ul className="w-full space-y-2 text-sm">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5">
              <span className="size-3 shrink-0 rounded-[4px]" style={{ background: s.colour }} aria-hidden />
              <span className="flex-1 text-fg">{s.label}</span>
              <span className="w-11 text-right font-semibold text-fg">{pct(s.value)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-fg">Show as a table</summary>
        <table className="mt-2 w-full text-left text-[13px]">
          <thead><tr className="border-b border-line text-muted"><th className="py-1 font-medium">Group</th><th className="py-1 text-right font-medium">Share</th></tr></thead>
          <tbody>{slices.map((s) => <tr key={s.label} className="border-b border-line/60"><td className="py-1">{s.label}</td><td className="py-1 text-right">{pct(s.value)}%</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/**
 * Illustrative breakdown that mirrors the innovation scene on the ground: mostly young, mostly men.
 * In production these come from the live database (optional profile fields, shown only as totals).
 */
const AGES: [string, number][] = [['18–24', 28], ['25–29', 30], ['30–35', 22], ['36 and over', 17], ['Not stated', 3]];
const GENDER: [string, number][] = [['Women', 28], ['Men', 70], ['Not stated', 2]];
export const ILLUSTRATIVE = { youthPct: 80, womenPct: 28, womenGoal: 50 };

/** Youth and women representation among innovators, framed as a goalpost to close the gaps. */
export function InclusionStats() {
  const ageColours = ['var(--viz-age-1)', 'var(--viz-age-2)', 'var(--viz-age-3)', 'var(--viz-age-4)', 'var(--viz-na)'];
  const genderColours = ['var(--viz-women)', 'var(--viz-men)', 'var(--viz-na)'];
  const ages: Slice[] = AGES.map(([label, value], i) => ({ label, value, colour: ageColours[i] }));
  const gender: Slice[] = GENDER.map(([label, value], i) => ({ label, value, colour: genderColours[i] }));
  const { youthPct, womenPct, womenGoal } = ILLUSTRATIVE;
  return (
    <section className="bg-alt py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="eyebrow">Inclusion</span>
            <h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">Who Is Taking Part</h2>
            <p className="mt-2 text-muted">Innovation hubs measure how well they reach young people and women. The portal tracks both for every competition.</p>
          </div>
          <div className="flex gap-3">
            <div className="card flex items-center gap-3 px-4 py-3"><Users size={18} className="text-[var(--brand)]" /><span><span className="font-display block text-2xl font-extrabold leading-none">{youthPct}%</span><span className="text-xs text-muted">youth, aged 18 to 35</span></span></div>
            <div className="card flex items-center gap-3 px-4 py-3"><Venus size={18} className="text-[var(--brand)]" /><span><span className="font-display block text-2xl font-extrabold leading-none">{womenPct}%</span><span className="text-xs text-muted">women</span></span></div>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Donut id="age" title="Innovators by age" slices={ages} centre={`${youthPct}%`} centreSub="are youth" />
          <Donut id="gender" title="Innovators by gender" slices={gender} centre={`${womenPct}%`} centreSub="are women" />
        </div>
        <div className="reveal mt-6 grid overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-[16rem_1fr] lg:grid-cols-[20rem_1fr]">
          <figure className="relative min-h-52 md:min-h-full"><Image src="/photos/young-makers.webp" alt="Two young women building a robot in a makerspace" fill sizes="(min-width:1024px) 20rem, (min-width:768px) 16rem, 100vw" className="object-cover" /></figure>
          <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold"><Target size={20} className="text-[var(--brand)]" /> Why we show these numbers</h3>
            <p className="mt-2 text-muted">They are a goalpost, not a scoreboard. Young people already lead, but women are fewer than one in three innovators. Putting the gap in plain sight lets CEDA aim outreach, set targets for each competition, and check every year whether the gap is closing.</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm"><span className="font-semibold">Women innovators</span><span className="text-muted">{womenPct}% now, goal {womenGoal}%</span></div>
              <div className="relative mt-2 h-2.5 rounded-full bg-sand"><div className="h-full rounded-full bg-[var(--viz-women)]" style={{ width: `${womenPct}%` }} /><span className="absolute -top-1 h-[18px] w-0.5 rounded bg-fg" style={{ left: `${womenGoal}%` }} title={`Goal: ${womenGoal}%`} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm"><span className="font-semibold">Youth innovators</span><span className="text-muted">{youthPct}% now, keep above 75%</span></div>
              <div className="relative mt-2 h-2.5 rounded-full bg-sand"><div className="h-full rounded-full bg-[var(--viz-age-3)]" style={{ width: `${youthPct}%` }} /><span className="absolute -top-1 h-[18px] w-0.5 rounded bg-fg" style={{ left: '75%' }} title="Goal: above 75%" /></div>
            </div>
          </div>
        </div>
        </div>
        <p className="mt-4 text-xs text-muted">Illustrative figures, shaped like the typical mix in innovation programmes (mostly young, mostly men). On a live portal they come straight from the database: age and gender are optional in each profile and only ever shown as totals, in line with the Data Protection Act 2024.</p>
      </div>
    </section>
  );
}
