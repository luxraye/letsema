'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Layers, CalendarDays, Scale, ShieldCheck, Check, ArrowRight, ExternalLink } from 'lucide-react';

const TEMPLATES = [
  { name: 'National Hackathon', meta: 'Teams of up to 5 · 6 hackathon criteria', note: 'Hackathon blueprint loaded: team entries, a shortlist of 5 and the hackathon rubric.' },
  { name: 'Open Funding Call', meta: 'Individuals or companies · 5 criteria', note: 'Funding call blueprint loaded: citizen eligibility, the standard form and three evaluators per entry.' },
  { name: 'Ideas Challenge', meta: 'Quick ideas · 2 evaluators each', note: 'Ideas blueprint loaded: a short form and two evaluators per idea, ideal for youth and staff challenges.' },
];

const STAGES = [['Registration', 'Opens'], ['Screening', 'Completeness'], ['Scoring', 'Blind, by evaluators'], ['Panel', 'Vote and awards']];

const RUBRIC = [['Innovation', 25], ['Impact and jobs', 25], ['Commercial viability', 25], ['Team', 15], ['Use of funds', 10]] as const;

const STEPS = [
  { icon: Layers, label: 'Pick a Template' },
  { icon: CalendarDays, label: 'Set Dates & Rules' },
  { icon: Scale, label: 'Choose Scoring' },
  { icon: ShieldCheck, label: 'Seal & Publish' },
];

/** A walk-through of Instance Studio: the same four steps an admin takes, shown without signing in. */
export function StudioPreview() {
  const [step, setStep] = useState(0);
  const [tpl, setTpl] = useState(0);
  const [weights, setWeights] = useState<number[]>(RUBRIC.map(([, w]) => w));
  const total = weights.reduce((s, w) => s + w, 0);

  return (
    <div>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4" role="tablist">
        {STEPS.map((s, i) => (
          <button key={s.label} type="button" role="tab" aria-selected={step === i} onClick={() => setStep(i)}
            className={`flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition ${step === i ? 'border-[var(--brand)] shadow-[0_0_0_3px_rgba(224,80,24,.12)]' : 'border-line hover:border-stone-300'}`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${step === i ? 'bg-[var(--brand)] text-white' : 'bg-sand text-ink'}`}><s.icon size={16} /></span>
            <span><span className="block text-[10px] font-bold uppercase tracking-wider">Step {i + 1}</span><span className="block text-xs font-bold">{s.label}</span></span>
          </button>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8" role="tabpanel">
        {step === 0 && <>
          <h3 className="text-lg font-bold">1. Start with a tested competition template</h3>
          <p className="mt-1 text-sm text-muted">Each template comes with stages, a form and a scoring rubric already filled in, so a new competition takes minutes.</p>
          <div className="mt-5 rounded-2xl border border-line bg-sand/40 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {TEMPLATES.map((t, i) => (
                <button key={t.name} type="button" onClick={() => setTpl(i)} aria-pressed={tpl === i} className={`rounded-xl border bg-white p-3 text-left transition ${tpl === i ? 'border-[var(--brand)]' : 'border-line opacity-70 hover:opacity-100'}`}>
                  <span className="flex items-center justify-between text-sm font-bold">{t.name}{tpl === i && <Check size={15} className="text-[var(--brand)]" />}</span>
                  <span className="text-[11px] text-muted">{t.meta}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs italic text-muted"><Check size={13} /> {TEMPLATES[tpl].note}</p>
          </div>
        </>}
        {step === 1 && <>
          <h3 className="text-lg font-bold">2. Set the dates and who can enter</h3>
          <p className="mt-1 text-sm text-muted">Stages run in order, each with its own dates. Eligibility is checked before anyone starts writing.</p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-4">{STAGES.map(([l, n], i) => <li key={l} className={`rounded-xl border p-3 text-sm ${i === 0 ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-line'}`}><div className="text-[10px] font-bold uppercase text-muted">Phase {i + 1}</div><div className="font-bold">{l}</div><div className="text-xs text-muted">{n}</div></li>)}</ol>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs">{['Botswana citizens', 'Aged 18 to 35', 'At least 51% citizen-owned', 'Teams of 1 to 5'].map((r) => <li key={r} className="chip border border-line bg-white"><Check size={12} className="text-emerald-600" />{r}</li>)}</ul>
        </>}
        {step === 2 && <>
          <h3 className="text-lg font-bold">3. Choose how entries are scored</h3>
          <p className="mt-1 text-sm text-muted">Applicants see these weights before they apply. Try moving them: the weights must add up to 100.</p>
          <div className="mt-5 space-y-3">{RUBRIC.map(([l], i) => (
            <label key={l} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm"><span className="font-semibold">{l}</span>
              <input type="range" min={0} max={50} step={5} value={weights[i]} onChange={(e) => setWeights((w) => w.map((x, j) => (j === i ? Number(e.target.value) : x)))} className="accent-[var(--brand)]" />
              <span className="mono text-right">{weights[i]}%</span></label>
          ))}</div>
          <p className={`mt-3 text-xs font-bold ${total === 100 ? 'text-emerald-700' : 'text-rose-700'}`}>{total === 100 ? 'Adds up to 100. Ready to publish.' : `Adds up to ${total}. Studio will not publish until it is 100.`}</p>
        </>}
        {step === 3 && <>
          <h3 className="text-lg font-bold">4. Seal the rules and publish</h3>
          <p className="mt-1 text-sm text-muted">On publishing, the rules get a fingerprint. If anything changes later, the change is published with a reason, and entries keep the rules they applied under.</p>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><div className="flex items-center gap-2 font-bold text-emerald-800"><ShieldCheck size={16} /> Rules sealed</div><p className="mt-1 text-emerald-900/80">Every competition page shows its fingerprint, so anyone can check the rules were not quietly changed.</p></div>
        </>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Link href="/judges" className="inline-flex items-center gap-1 text-xs font-bold hover:text-[var(--brand)]">Explore this in the Judges&apos; Tour <ArrowRight size={13} /></Link>
          <Link href="/dashboard/instances/new" className="btn-primary !rounded-lg !px-4 !py-2 text-xs font-bold">Open Instance Studio <ExternalLink size={13} /></Link>
        </div>
      </div>
    </div>
  );
}
