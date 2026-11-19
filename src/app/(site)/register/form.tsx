'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { register, type FormState } from '@/app/actions/auth';
import { FormMessage, Submit } from '@/components/forms';

export function RegisterForm() {
  const [s, action] = useActionState<FormState, FormData>(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <div><label className="label" htmlFor="name">Full name</label><input className="field" id="name" name="name" autoComplete="name" required /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="email">Email</label><input className="field" id="email" name="email" type="email" autoComplete="email" required /></div>
        <div><label className="label" htmlFor="phone">Mobile number <span className="font-normal text-muted">(optional)</span></label><input className="field" id="phone" name="phone" type="tel" placeholder="71 234 567" autoComplete="tel" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="password">Password</label><input className="field" id="password" name="password" type="password" autoComplete="new-password" minLength={10} required /></div>
        <div><label className="label" htmlFor="confirm">Repeat password</label><input className="field" id="confirm" name="confirm" type="password" autoComplete="new-password" required /></div>
      </div>
      <p className="text-xs text-muted">At least 10 characters, with letters and a number.</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consent" className="mt-1" /> <span>I have read the <Link href="/privacy" className="underline" target="_blank">privacy notice</Link> and agree that CEDA may use my details to run the competitions I enter (Data Protection Act 2024).</span></label>
      <FormMessage state={s} />
      <Submit>Create account</Submit>
      <p className="text-center text-xs text-muted">We will send a code to confirm your email{' '}and phone.</p>
    </form>
  );
}
