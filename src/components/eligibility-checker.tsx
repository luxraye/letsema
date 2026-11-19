'use client';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { InstanceDefinition } from '@/db/schema';
import { checkEligibility } from '@/lib/eligibility';

export function EligibilityChecker({ def }: { def: InstanceDefinition }) {
  const [a, setA] = useState({ age: '', citizen: '', cipa: '', youthShare: '', staff: '' });
  const e = def.eligibility;
  const answered = Object.entries(a).filter(([, v]) => v !== '').length;
  const v = checkEligibility(def, { age: a.age ? Number(a.age) : undefined, citizen: a.citizen === 'yes', cipa: a.cipa === 'yes', youthShare: a.youthShare ? Number(a.youthShare) : undefined, staff: a.staff === 'yes' });
  const yn = (k: keyof typeof a, label: string) => (
    <fieldset><legend className="label">{label}</legend><div className="flex gap-2">{['yes', 'no'].map((o) => <label key={o} className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold ${a[k] === o ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-line'}`}><input type="radio" className="sr-only" name={k} checked={a[k] === o} onChange={() => setA({ ...a, [k]: o })} />{o === 'yes' ? 'Yes' : 'No'}</label>)}</div></fieldset>
  );
  const needed = v.reasons.length;
  return (
    <div className="card grid gap-5 p-5 md:grid-cols-2">
      <div className="space-y-4">
        {def.audience === 'staff' && yn('staff', 'Do you work for CEDA?')}
        {e.citizenOnly && yn('citizen', 'Are you a citizen of Botswana?')}
        {(e.minAge || e.maxAge) && <div><label className="label" htmlFor="age">How old are you?</label><input id="age" className="field" type="number" min={10} max={100} value={a.age} onChange={(x) => setA({ ...a, age: x.target.value })} /></div>}
        {e.cipaRequired && yn('cipa', 'Is your business registered with CIPA?')}
        {e.minYouthShare ? <div><label className="label" htmlFor="ys">What % of the business do citizens aged 18–35 own?</label><input id="ys" className="field" type="number" min={0} max={100} value={a.youthShare} onChange={(x) => setA({ ...a, youthShare: x.target.value })} /></div> : null}
        {needed === 0 && <p className="text-sm text-muted">This competition is open to everyone.</p>}
      </div>
      <div aria-live="polite" className={`rounded-2xl p-5 ${answered >= needed && v.ok ? 'bg-emerald-50' : answered >= needed ? 'bg-rose-50' : 'bg-sand'}`}>
        <div className="text-lg font-bold">{answered < needed ? 'Answer the questions to see your result' : v.ok ? 'You can apply' : 'Not this time'}</div>
        <ul className="mt-3 space-y-2 text-sm">{v.reasons.map((r) => <li key={r.text} className="flex items-center gap-2">{r.ok ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-rose-600" />}{r.text}</li>)}</ul>
        {answered >= needed && !v.ok && <p className="mt-3 text-sm">Other CEDA programmes may suit you. Ask us on live chat, or see <a className="underline" href="/instances">all competitions</a>.</p>}
        <p className="mt-4 text-xs text-muted">Nothing you type here is saved or sent.</p>
      </div>
    </div>
  );
}
