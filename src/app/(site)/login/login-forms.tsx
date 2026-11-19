'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { login, sendLoginCode, verifyLoginCode, type FormState } from '@/app/actions/auth';
import { FormMessage, Submit } from '@/components/forms';
import { PasskeySignIn } from '@/components/passkey-buttons';

export function LoginForms({ next, notice }: { next: string; notice?: string }) {
  const [tab, setTab] = useState<'password' | 'code' | 'passkey'>('password');
  const [pw, pwAction] = useActionState<FormState, FormData>(login, undefined);
  const [codeReq, codeReqAction] = useActionState<FormState, FormData>(sendLoginCode, undefined);
  const [codeVer, codeVerAction] = useActionState<FormState, FormData>(verifyLoginCode, undefined);
  const awaitingCode = codeReq?.step === 'code' || codeVer?.step === 'code';
  const target = codeVer?.target ?? codeReq?.target ?? '';
  return (
    <div>
      {notice && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
      <div role="tablist" className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-sand p-1 text-sm font-semibold">
        {([['password', 'Password'], ['code', 'One-time code'], ['passkey', 'Fingerprint']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-lg py-2 ${tab === k ? 'bg-white shadow-sm' : 'text-muted'}`}>{l}</button>
        ))}
      </div>
      {tab === 'password' && (
        <form action={pwAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div><label className="label" htmlFor="email">Email or phone</label><input className="field" id="email" name="email" autoComplete="username" required /></div>
          <div><div className="flex justify-between"><label className="label" htmlFor="password">Password</label><Link href="/forgot" className="text-sm font-semibold text-[var(--brand)]">Forgot password?</Link></div><input className="field" id="password" name="password" type="password" autoComplete="current-password" required /></div>
          <FormMessage state={pw} />
          <Submit className="btn-ink w-full !py-3 text-base font-medium">Sign in</Submit>
        </form>
      )}
      {tab === 'code' && (!awaitingCode ? (
        <form action={codeReqAction} className="space-y-4">
          <div><label className="label" htmlFor="contact">Email or phone number</label><input className="field" id="contact" name="contact" placeholder="you@example.com or 71 234 567" required /></div>
          <p className="text-xs text-muted">We send a 6-digit code by email or SMS. No password needed.</p>
          <FormMessage state={codeReq} />
          <Submit>Send me a code</Submit>
        </form>
      ) : (
        <form action={codeVerAction} className="space-y-4">
          <input type="hidden" name="contact" value={target} /><input type="hidden" name="next" value={next} />
          <FormMessage state={codeVer ?? codeReq} />
          <div><label className="label" htmlFor="code">6-digit code</label><input className="field mono text-center text-2xl tracking-[.4em]" id="code" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required autoFocus /></div>
          <p className="text-xs text-muted">Demo: the code is in the <Link className="underline" href="/demo-inbox" target="_blank">demo inbox</Link>.</p>
          <Submit className="btn-ink w-full !py-3 text-base font-medium">Sign in</Submit>
        </form>
      ))}
      {tab === 'passkey' && <PasskeySignIn next={next} />}
    </div>
  );
}
