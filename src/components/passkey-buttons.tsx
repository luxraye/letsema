'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint } from 'lucide-react';
import { startAuthentication, startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';

async function call(step: string, body?: object) {
  const r = await fetch(`/api/passkey/${step}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Something went wrong'); return j;
}

export function PasskeySignIn({ next = '/dashboard' }: { next?: string }) {
  const [msg, setMsg] = useState<string | null>(null); const router = useRouter();
  const go = async () => {
    setMsg(null);
    if (!browserSupportsWebAuthn()) return setMsg('This browser does not support passkeys.');
    try { const opts = await call('login-options'); const response = await startAuthentication({ optionsJSON: opts }); await call('login-verify', { response }); router.push(next); router.refresh(); }
    catch (e) { setMsg((e as Error).name === 'NotAllowedError' ? 'Cancelled.' : (e as Error).message); }
  };
  return (
    <div>
      <button type="button" onClick={go} className="btn-primary w-full !py-3"><Fingerprint size={18} /> Sign in with fingerprint, face or device PIN</button>
      {msg && <p role="alert" className="mt-2 text-sm text-rose-700">{msg}</p>}
      <p className="mt-3 text-xs text-muted">Uses a passkey saved on this device. Your fingerprint or face never leaves your phone or laptop. First time? Sign in another way, then add a passkey in your profile.</p>
    </div>
  );
}

export function AddPasskey() {
  const [msg, setMsg] = useState<string | null>(null); const router = useRouter();
  const go = async () => {
    setMsg(null);
    try { const opts = await call('register-options'); const response = await startRegistration({ optionsJSON: opts }); await call('register-verify', { response, label: navigator.platform || 'This device' }); setMsg('Passkey added. Next time you can sign in with it.'); router.refresh(); }
    catch (e) { setMsg((e as Error).name === 'NotAllowedError' ? 'Cancelled.' : (e as Error).message); }
  };
  return <div><button type="button" onClick={go} className="btn-ghost"><Fingerprint size={16} /> Add a passkey on this device</button>{msg && <p className="mt-2 text-sm text-muted">{msg}</p>}</div>;
}
