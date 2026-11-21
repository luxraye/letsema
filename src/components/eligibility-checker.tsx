'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleHelp, XCircle, ArrowRight } from 'lucide-react';
import { BUSINESS_STAGES, type InstanceDefinition } from '@/db/schema';
import { checkEligibility, STAGE_LABEL, type EligibilityAnswers, type Reason } from '@/lib/eligibility';

type Raw = { age: string; citizen: string; cipa: string; youthShare: string; staff: string; womenOwned: string; stage: string; sector: string };
const EMPTY: Raw = { age: '', citizen: '', cipa: '', youthShare: '', staff: '', womenOwned: '', stage: '', sector: '' };

export function toAnswers(a: Raw): EligibilityAnswers {
  const yn = (v: string) => (v === '' ? undefined : v === 'yes');
  return {
    age: a.age ? Number(a.age) : undefined, citizen: yn(a.citizen), cipa: yn(a.cipa), youthShare: a.youthShare ? Number(a.youthShare) : undefined,
    staff: yn(a.staff), womenOwned: yn(a.womenOwned), stage: (a.stage || undefined) as EligibilityAnswers['stage'], sector: a.sector || undefined,
  };
}

/** Which questions a set of competitions needs, so we only ask what matters. */
export function neededQuestions(defs: InstanceDefinition[]) {
  const any = (f: (d: InstanceDefinition) => unknown) => defs.some((d) => !!f(d));
  return {
    staff: any((d) => d.audience === 'staff'), citizen: any((d) => d.eligibility.citizenOnly), age: any((d) => d.eligibility.minAge || d.eligibility.maxAge),
    cipa: any((d) => d.eligibility.cipaRequired), youthShare: any((d) => d.eligibility.minYouthShare), womenOwned: any((d) => d.eligibility.womenLed),
    stage: any((d) => d.eligibility.businessStages?.length), sector: any((d) => d.eligibility.sectorRequired && d.sectors.length),
  };
}

/** The questions themselves, shared by the single-competition checker and the "which can I enter" finder. */
export function Questions({ a, setA, need, sectors }: { a: Raw; setA: (r: Raw) => void; need: ReturnType<typeof neededQuestions>; sectors: string[] }) {
  const yn = (k: keyof Raw, label: string) => (
    <fieldset><legend className="label">{label}</legend><div className="flex gap-2">{['yes', 'no'].map((o) => <label key={o} className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold ${a[k] === o ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-line'}`}><input type="radio" className="sr-only" name={k} checked={a[k] === o} onChange={() => setA({ ...a, [k]: o })} />{o === 'yes' ? 'Yes' : 'No'}</label>)}</div></fieldset>
  );
  return (
    <div className="space-y-4">
      {need.staff && yn('staff', 'Do you work for CEDA?')}
      {need.citizen && yn('citizen', 'Are you a citizen of Botswana?')}
      {need.age && <div><label className="label" htmlFor="age">How old are you?</label><input id="age" className="field" type="number" min={10} max={100} value={a.age} onChange={(x) => setA({ ...a, age: x.target.value })} /></div>}
      {need.stage && <div><label className="label" htmlFor="stage">Where is your business today?</label><select id="stage" className="field" value={a.stage} onChange={(x) => setA({ ...a, stage: x.target.value })}><option value="">Choose one</option>{BUSINESS_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></div>}
      {need.sector && <div><label className="label" htmlFor="sector">Which sector do you work in?</label><select id="sector" className="field" value={a.sector} onChange={(x) => setA({ ...a, sector: x.target.value })}><option value="">Choose one</option>{sectors.map((s) => <option key={s}>{s}</option>)}</select></div>}
      {need.cipa && yn('cipa', 'Is your business registered with CIPA?')}
      {need.womenOwned && yn('womenOwned', 'Do women own at least 51% of the business?')}
      {need.youthShare && <div><label className="label" htmlFor="ys">What % of the business do citizens aged 18 to 35 own?</label><input id="ys" className="field" type="number" min={0} max={100} value={a.youthShare} onChange={(x) => setA({ ...a, youthShare: x.target.value })} /></div>}
    </div>
  );
}

export function ReasonList({ reasons }: { reasons: Reason[] }) {
  return <ul className="space-y-2 text-sm">{reasons.map((r) => <li key={r.text} className="flex items-start gap-2">{r.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> : r.unknown ? <CircleHelp size={16} className="mt-0.5 shrink-0 text-muted" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />}<span>{r.text}</span></li>)}</ul>;
}

export { EMPTY as EMPTY_ANSWERS, type Raw as RawAnswers };

/** "Am I eligible for this competition?" Asks only what this competition's own rules need. */
export function EligibilityChecker({ def, name }: { def: InstanceDefinition; name?: string }) {
  const [a, setA] = useState<Raw>(EMPTY);
  const v = checkEligibility(def, toAnswers(a));
  const pending = v.reasons.some((r) => r.unknown);
  const none = v.reasons.length === 0;
  return (
    <div className="card grid gap-5 p-5 md:grid-cols-2">
      <div>
        {none ? <p className="text-sm text-muted">{name ?? 'This competition'} has no entry rules beyond a free account. Anyone can apply.</p>
          : <Questions a={a} setA={setA} need={neededQuestions([def])} sectors={def.sectors} />}
      </div>
      <div aria-live="polite" className={`rounded-2xl p-5 ${none || (!pending && v.ok) ? 'bg-emerald-50 text-emerald-950' : !pending ? 'bg-rose-50 text-rose-950' : 'bg-sand'}`}>
        <div className="text-xs font-bold uppercase tracking-wider opacity-70">{name ? `Rules for ${name}` : 'This competition’s rules'}</div>
        <div className="mt-1 text-lg font-bold">{none || (!pending && v.ok) ? 'You can apply' : pending ? 'Answer the questions to see your result' : 'Not this competition'}</div>
        <div className="mt-3"><ReasonList reasons={v.reasons} /></div>
        {!pending && !v.ok && <p className="mt-3 text-sm">Other competitions have different rules. <Link className="inline-flex items-center gap-1 font-semibold underline" href="/eligibility">See which ones you can enter <ArrowRight size={13} /></Link></p>}
        <p className="mt-4 text-xs opacity-70">Nothing you type here is saved or sent.</p>
      </div>
    </div>
  );
}
