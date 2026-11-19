'use client';
import { useActionState } from 'react';
import { createInstance, type AState } from '@/app/actions/admin';
import { FormMessage, Submit } from '@/components/forms';

const T = [
  ['call', 'Funding call', 'Open call for businesses: 5 stages, standard form and score sheet'],
  ['ideas', 'Ideas challenge', 'Lighter call for early ideas, 2 evaluators each'],
  ['hackathon', 'Hackathon', 'Teams of 1–5, hackathon score sheet, top 5 shortlist'],
  ['accelerator', 'Accelerator intake', 'Cohort selection for a programme'],
  ['staff', 'Staff intrapreneurship', 'Internal campaign, CEDA staff only'],
];
export function NewInstanceForm({ spaces }: { spaces: { id: string; name: string }[] }) {
  const [s, action] = useActionState<AState, FormData>(createInstance, undefined);
  return (
    <form action={action} className="card space-y-5 p-6">
      <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="field" placeholder="e.g. Women in Agribusiness Fund 2027" required /></div>
      <div><label className="label" htmlFor="tagline">One-line description</label><input id="tagline" name="tagline" className="field" /></div>
      <div><label className="label" htmlFor="spaceId">Space</label><select id="spaceId" name="spaceId" className="field">{spaces.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
      <fieldset><legend className="label">Template</legend><div className="grid gap-2 sm:grid-cols-2">{T.map(([k, l, d], n) => <label key={k} className="cursor-pointer rounded-xl border border-line p-3 text-sm has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/5"><input type="radio" name="template" value={k} defaultChecked={n === 0} className="sr-only" /><b>{l}</b><span className="block text-xs text-muted">{d}</span></label>)}</div></fieldset>
      <FormMessage state={s} />
      <Submit>Create draft</Submit>
    </form>
  );
}
