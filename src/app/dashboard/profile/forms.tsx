'use client';
import { useActionState } from 'react';
import { updateProfile, type CState } from '@/app/actions/account';
import { changePassword, type FormState } from '@/app/actions/auth';
import { FormMessage, Submit } from '@/components/forms';
import { Badge } from '@/components/ui';

type Me = Record<'name' | 'email' | 'phone' | 'district' | 'dateOfBirth' | 'gender' | 'omang' | 'organisation' | 'cipaNumber', string> & { youthShare: number | string };
export function ProfileForm({ me, districts, verified }: { me: Me; districts: string[]; verified: { email: boolean; phone: boolean } }) {
  const [s, action] = useActionState<CState, FormData>(updateProfile, undefined);
  const f = (k: keyof Me, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <div><label className="label" htmlFor={k}>{label}</label><input id={k} name={k} className="field" defaultValue={String(me[k] ?? '')} {...props} /></div>;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {f('name', 'Full name')}
      <div><label className="label">Email {verified.email ? <Badge tone="green">confirmed</Badge> : <Badge tone="amber">not confirmed</Badge>}</label><input className="field" value={me.email} disabled /></div>
      <div><label className="label" htmlFor="phone">Mobile {me.phone && (verified.phone ? <Badge tone="green">confirmed</Badge> : <Badge tone="amber">not confirmed</Badge>)}</label><input id="phone" name="phone" className="field" defaultValue={me.phone} /></div>
      <div><label className="label" htmlFor="district">District</label><select id="district" name="district" className="field" defaultValue={me.district}><option value="">–</option>{districts.map((d) => <option key={d}>{d}</option>)}</select></div>
      {f('dateOfBirth', 'Date of birth', { type: 'date' })}
      {f('omang', 'Omang number', { inputMode: 'numeric' })}
      {f('organisation', 'Company name')}
      {f('cipaNumber', 'CIPA registration number')}
      {f('youthShare', '% owned by citizens aged 18–35', { inputMode: 'numeric' })}
      <div><label className="label" htmlFor="gender">Gender (optional, for reporting)</label><select id="gender" name="gender" className="field" defaultValue={me.gender}><option value="">Prefer not to say</option><option>Female</option><option>Male</option></select></div>
      <div className="sm:col-span-2"><FormMessage state={s} /></div>
      <div className="sm:col-span-2"><Submit className="btn-primary">Save details</Submit></div>
    </form>
  );
}
export function PasswordForm() {
  const [s, action] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="space-y-2 border-t border-line pt-4">
      <div className="text-sm font-semibold">Change password</div>
      <input name="current" type="password" className="field" placeholder="Current password" autoComplete="current-password" required />
      <div className="grid gap-2 sm:grid-cols-2"><input name="password" type="password" className="field" placeholder="New password" autoComplete="new-password" required /><input name="confirm" type="password" className="field" placeholder="Repeat new password" autoComplete="new-password" required /></div>
      <FormMessage state={s} /><Submit className="btn-ghost">Change password</Submit>
    </form>
  );
}
