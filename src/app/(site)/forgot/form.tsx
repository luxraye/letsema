'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { forgot, resetPassword, type FormState } from '@/app/actions/auth';
import { FormMessage, Submit } from '@/components/forms';

export function ForgotForm() {
  const [a, ask] = useActionState<FormState, FormData>(forgot, undefined);
  const [r, reset] = useActionState<FormState, FormData>(resetPassword, undefined);
  const stage = r?.step === 'code' || a?.step === 'code';
  const target = r?.target ?? a?.target ?? '';
  if (!stage) return (
    <form action={ask} className="space-y-4">
      <div><label className="label" htmlFor="contact">Email or phone on your account</label><input className="field" id="contact" name="contact" required /></div>
      <FormMessage state={a} />
      <Submit>Send reset code</Submit>
    </form>
  );
  return (
    <form action={reset} className="space-y-4">
      <input type="hidden" name="contact" value={target} />
      <FormMessage state={r ?? a} />
      <div><label className="label" htmlFor="code">6-digit code</label><input className="field mono text-center text-xl tracking-[.4em]" id="code" name="code" inputMode="numeric" maxLength={6} required /></div>
      <div><label className="label" htmlFor="password">New password</label><input className="field" id="password" name="password" type="password" autoComplete="new-password" minLength={10} required /></div>
      <p className="text-xs text-muted">Demo: the code is in the <Link href="/demo-inbox" target="_blank" className="underline">demo inbox</Link>. Changing your password signs you out on every device.</p>
      <Submit>Set new password</Submit>
    </form>
  );
}
