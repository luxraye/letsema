'use client';
import { useActionState } from 'react';
import { openTicket } from '@/app/actions/public';
import { Submit, FormMessage } from '@/components/forms';
import { SLA } from '@/lib/sla';

export function TicketForm({ name, contact }: { name?: string; contact?: string }) {
  const [state, action] = useActionState(openTicket, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="block"><span className="label">Your name</span><input name="name" defaultValue={name} required maxLength={80} className="field" /></label>
      <label className="block"><span className="label">Email or mobile for replies</span><input name="contact" defaultValue={contact} required maxLength={120} className="field" /></label>
      <label className="block"><span className="label">How serious is it?</span><select name="severity" defaultValue="P3" className="field">{Object.entries(SLA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
      <label className="block"><span className="label">About</span><select name="category" className="field"><option>Portal</option><option>My application</option><option>Signing in</option><option>Uploads</option><option>Something else</option></select></label>
      <label className="block sm:col-span-2"><span className="label">Short summary</span><input name="subject" required maxLength={140} className="field" placeholder="For example: the upload button does nothing" /></label>
      <label className="block sm:col-span-2"><span className="label">What happened?</span><textarea name="body" required maxLength={4000} rows={4} className="field" placeholder="What you did, what you expected, and what you saw instead" /></label>
      <div className="sm:col-span-2 space-y-2"><FormMessage state={state} /><Submit className="btn-primary">Send report</Submit></div>
    </form>
  );
}
