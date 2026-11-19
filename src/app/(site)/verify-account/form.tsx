'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { verifyAccount, resendCode, type FormState } from '@/app/actions/auth';
import { FormMessage, Submit } from '@/components/forms';

export function VerifyForm({ email, phone }: { email: string; phone?: string }) {
  const [s, action] = useActionState<FormState, FormData>(verifyAccount, undefined);
  const [note, setNote] = useState<string | null>(null);
  const resend = async (t: string, p: 'verify_email' | 'verify_phone') => { const r = await resendCode(t, p); setNote(r.ok ?? r.error ?? null); };
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />{phone && <input type="hidden" name="phone" value={phone} />}
      <div><label className="label" htmlFor="emailCode">Code sent to {email}</label><input className="field mono text-center text-xl tracking-[.4em]" id="emailCode" name="emailCode" inputMode="numeric" maxLength={6} required /><button type="button" onClick={() => resend(email, 'verify_email')} className="mt-1 text-xs underline">Send again</button></div>
      {phone && <div><label className="label" htmlFor="phoneCode">Code sent by SMS to {phone}</label><input className="field mono text-center text-xl tracking-[.4em]" id="phoneCode" name="phoneCode" inputMode="numeric" maxLength={6} required /><button type="button" onClick={() => resend(phone, 'verify_phone')} className="mt-1 text-xs underline">Send again</button></div>}
      {note && <p className="text-sm text-muted">{note}</p>}
      <FormMessage state={s} />
      <Submit>Confirm and continue</Submit>
      <p className="text-center text-xs text-muted">Demo: open the <Link href="/demo-inbox" target="_blank" className="underline">demo inbox</Link> to read the codes.</p>
    </form>
  );
}
