'use client';
import { useActionState, useState } from 'react';
import { Braces, CheckCircle2, LayoutTemplate } from 'lucide-react';
import { createInstance, createInstanceFromCode, type AState } from '@/app/actions/admin';
import { FormMessage, Submit } from '@/components/forms';
import { parseInstanceCode } from '@/lib/definition-code';

const T = [
  ['call', 'Funding call', 'Open call for businesses: 5 stages, standard form and score sheet'],
  ['ideas', 'Ideas challenge', 'Lighter call for early ideas, 2 evaluators each'],
  ['hackathon', 'Hackathon', 'Teams of 1–5, hackathon score sheet, top 5 shortlist'],
  ['accelerator', 'Accelerator intake', 'Cohort selection for a programme'],
  ['staff', 'Staff intrapreneurship', 'Internal campaign, CEDA staff only'],
];

function SpacePicker({ spaces }: { spaces: { id: string; name: string }[] }) {
  return <div><label className="label" htmlFor="spaceId">Space</label><select id="spaceId" name="spaceId" className="field">{spaces.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>;
}

/** Two ways in: pick a template (no code), or paste a JSON document (for IT staff). */
export function NewInstanceForm({ spaces, sample }: { spaces: { id: string; name: string }[]; sample: string }) {
  const [mode, setMode] = useState<'template' | 'code'>('template');
  const [s, action] = useActionState<AState, FormData>(createInstance, undefined);
  const [cs, codeAction] = useActionState<AState, FormData>(createInstanceFromCode, undefined);
  const [code, setCode] = useState(sample);
  const check = parseInstanceCode(code);
  return (
    <div className="space-y-4">
      <div role="tablist" className="inline-flex gap-1 rounded-xl bg-surface p-1 shadow-sm">
        <button type="button" role="tab" aria-selected={mode === 'template'} onClick={() => setMode('template')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'template' ? 'bg-ink text-white' : 'text-muted hover:text-fg'}`}><LayoutTemplate size={15} /> From a template</button>
        <button type="button" role="tab" aria-selected={mode === 'code'} onClick={() => setMode('code')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'code' ? 'bg-ink text-white' : 'text-muted hover:text-fg'}`}><Braces size={15} /> From code (JSON)</button>
      </div>
      {mode === 'template' ? (
        <form action={action} className="card space-y-5 p-6">
          <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="field" placeholder="e.g. Women in Agribusiness Fund 2027" required /></div>
          <div><label className="label" htmlFor="tagline">One-line description</label><input id="tagline" name="tagline" className="field" /></div>
          <SpacePicker spaces={spaces} />
          <fieldset><legend className="label">Template</legend><div className="grid gap-2 sm:grid-cols-2">{T.map(([k, l, d], n) => <label key={k} className="cursor-pointer rounded-xl border border-line p-3 text-sm has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/5"><input type="radio" name="template" value={k} defaultChecked={n === 0} className="sr-only" /><b>{l}</b><span className="block text-xs text-muted">{d}</span></label>)}</div></fieldset>
          <FormMessage state={s} />
          <Submit>Create draft</Submit>
        </form>
      ) : (
        <form action={codeAction} className="card space-y-4 p-6">
          <p className="text-sm text-muted">For IT staff: paste a whole competition as JSON, or edit the example below. It is checked as you type and again on the server, and it starts as a draft you can review in Instance Studio before anything goes live.</p>
          <SpacePicker spaces={spaces} />
          <textarea name="code" aria-label="Competition as JSON" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} className="field mono min-h-[26rem] whitespace-pre !text-[12.5px] leading-relaxed" />
          {check.doc
            ? <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 size={16} /> Valid: “{check.doc.name}”, {check.doc.definition.form.length} questions, {check.doc.definition.rubric.length} scoring criteria.</p>
            : <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900"><b>Not ready yet:</b><ul className="mt-1 list-disc pl-5">{check.errors.map((e) => <li key={e} className="mono text-[12.5px]">{e}</li>)}</ul></div>}
          <FormMessage state={cs} />
          {cs?.errors && <ul className="list-disc pl-5 text-sm text-rose-700">{cs.errors.map((e) => <li key={e} className="mono text-[12.5px]">{e}</li>)}</ul>}
          <Submit>Create draft from code</Submit>
        </form>
      )}
    </div>
  );
}
