'use client';
import { useActionState } from 'react';
import { createThread } from '@/app/actions/community';
import { Submit, FormMessage } from '@/components/forms';

export function NewThread({ categories }: { categories: string[] }) {
  const [state, action] = useActionState(createThread, undefined);
  return (
    <form action={action} className="card space-y-4 p-6">
      <label className="block"><span className="label">Topic</span><select name="category" className="field">{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="block"><span className="label">Your question</span><input name="title" required minLength={8} maxLength={140} className="field" placeholder="For example: do I need a trading licence to pilot?" /></label>
      <label className="block"><span className="label">Details</span><textarea name="body" required minLength={10} maxLength={5000} rows={5} className="field" /></label>
      <p className="text-xs text-muted">Everyone can read the community. Do not post your Omang number, phone number or anything private.</p>
      <FormMessage state={state} />
      <Submit className="btn-primary">Post question</Submit>
    </form>
  );
}
