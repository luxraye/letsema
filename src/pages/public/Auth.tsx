import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { Fingerprint, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Button, Field, Tabs, toast, useStore, Avatar } from '../../ui/kit';
import { Logo, DEMO_ACCOUNTS } from '../../ui/layout';
import {
  ActionError, demoLogin, forgotPassword, login, otpLogin, passkeyLogin, PASSWORD_RULES, register, requestOtpLogin, resendVerification, resetPassword, verifyAccount,
} from '../../core/actions';
import { DEMO_PASSWORD } from '../../core/seed';

type Mode = 'login' | 'register' | 'forgot' | 'confirm';

function Shell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[1fr_380px]">
      <div className="card p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
        <div className="mt-6">{children}</div>
      </div>
      <DemoPanel />
    </div>
  );
}

function DemoPanel() {
  const nav = useNavigate();
  return (
    <aside className="card h-fit p-5">
      <div className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-brand" /> Demo accounts</div>
      <p className="mt-1 text-sm text-muted">Sign in with one click, or use any email below with password <code className="kbd">{DEMO_PASSWORD}</code>.</p>
      <ul className="mt-4 space-y-1.5">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.id}>
            <button onClick={() => { demoLogin(a.id); nav('/app'); }} className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2 text-left hover:border-brand hover:bg-brand-soft">
              <Avatar name={a.who} size={30} />
              <span className="min-w-0"><span className="block text-sm font-semibold">{a.role}</span><span className="block truncate text-xs text-muted">{a.does}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function Auth({ mode }: { mode: Mode }) {
  if (mode === 'register') return <Register />;
  if (mode === 'forgot') return <Forgot />;
  if (mode === 'confirm') return <Confirm />;
  return <Login />;
}

function useAfterLogin() {
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  return () => nav(params.get('next') ?? (loc.state as { from?: string } | null)?.from ?? '/app', { replace: true });
}

function Login() {
  const [tab, setTab] = useState<'password' | 'code' | 'passkey'>('password');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const done = useAfterLogin();
  const nav = useNavigate();
  const run = (fn: () => void) => {
    setErr('');
    try { fn(); } catch (e) {
      const m = (e as Error).message;
      if (m.startsWith('UNVERIFIED:')) { toast('Please verify your account first. We sent a new code.', 'info'); nav(`/confirm/${m.slice(11)}`); return; }
      setErr(e instanceof ActionError ? m : 'Something went wrong. Please try again.');
    }
  };
  const passkey = async () => {
    setErr('');
    if (!window.PublicKeyCredential) return setErr('This browser does not support passkeys.');
    try {
      const cred = (await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), userVerification: 'required', timeout: 60000 } })) as PublicKeyCredential | null;
      if (!cred) return;
      run(() => { passkeyLogin(cred.id); done(); });
    } catch { setErr('Passkey sign-in was cancelled or is not available on this device.'); }
  };
  return (
    <Shell title="Sign in" sub="Choose the way that suits you.">
      <Tabs value={tab} onChange={(v) => { setTab(v); setErr(''); }} items={[{ key: 'password', label: <span className="inline-flex items-center gap-1.5"><KeyRound size={15} /> Password</span> }, { key: 'code', label: <span className="inline-flex items-center gap-1.5"><Mail size={15} /> One-time code</span> }, { key: 'passkey', label: <span className="inline-flex items-center gap-1.5"><Fingerprint size={15} /> Fingerprint / face</span> }]} />
      <div className="mt-6 space-y-4">
        {tab === 'password' && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => { login(contact, password); done(); }); }}>
            <Field label="Email or mobile number" htmlFor="c"><input id="c" className="field" autoComplete="username" value={contact} onChange={(e) => setContact(e.target.value)} /></Field>
            <Field label="Password" htmlFor="p"><input id="p" type="password" className="field" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            <div className="flex items-center justify-between"><Button type="submit">Sign in</Button><Link to="/forgot" className="text-sm font-semibold text-brand">Forgot password?</Link></div>
          </form>
        )}
        {tab === 'code' && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!sent) { requestOtpLogin(contact); setSent(true); toast('If that account exists, a code was sent. See the demo inbox.', 'info'); } else run(() => { otpLogin(contact, code); done(); }); }}>
            <Field label="Email or mobile number" htmlFor="oc"><input id="oc" className="field" value={contact} onChange={(e) => setContact(e.target.value)} disabled={sent} /></Field>
            {sent && <Field label="6-digit code" htmlFor="code" help="Open the demo inbox in a new tab to read it."><input id="code" inputMode="numeric" autoComplete="one-time-code" className="field font-mono text-lg tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></Field>}
            <div className="flex items-center gap-3"><Button type="submit">{sent ? 'Sign in' : 'Send me a code'}</Button>{sent && <a href="#/inbox" target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand">Open demo inbox ↗</a>}</div>
          </form>
        )}
        {tab === 'passkey' && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Use the fingerprint reader, face unlock or PIN on your device. Set up a passkey first from your profile after signing in once.</p>
            <Button onClick={passkey}><Fingerprint size={16} /> Sign in with a passkey</Button>
          </div>
        )}
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{err}</p>}
        <p className="border-t border-line pt-4 text-sm text-muted">New here? <Link to="/register" className="font-semibold text-brand">Create an account</Link></p>
      </div>
    </Shell>
  );
}

function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', consent: false });
  const [err, setErr] = useState('');
  const [params] = useSearchParams();
  const strength = [f.password.length >= 10, /[a-z]/i.test(f.password), /\d/.test(f.password), /[^a-z0-9]/i.test(f.password)].filter(Boolean).length;
  return (
    <Shell title="Create your account" sub="It takes a minute. We verify your email or phone with a one-time code.">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault(); setErr('');
        try { const u = register(f); toast('Account created. Enter the code we sent you.', 'info'); nav(`/confirm/${u.id}${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`); }
        catch (e2) { setErr((e2 as Error).message); }
      }}>
        <Field label="Full name" required htmlFor="n"><input id="n" className="field" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" required htmlFor="e"><input id="e" type="email" className="field" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Mobile (optional)" htmlFor="ph" help="If given, we verify by SMS."><input id="ph" type="tel" className="field" autoComplete="tel" placeholder="+267 71 234 567" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </div>
        <Field label="Password" required htmlFor="pw" help={PASSWORD_RULES}>
          <input id="pw" type="password" className="field" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <div className="mt-2 flex gap-1" aria-hidden>{[0, 1, 2, 3].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? (strength >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-line'}`} />)}</div>
        </Field>
        <label className="flex items-start gap-3 rounded-xl bg-paper p-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--brand)]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
          <span>I agree that CEDA may use my details to run the calls I enter, as described in the <Link to="/privacy" className="font-semibold text-brand underline" target="_blank">privacy notice</Link> (Data Protection Act, 2024). I can withdraw consent and download or erase my data at any time.</span>
        </label>
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{err}</p>}
        <Button type="submit" size="lg">Create account</Button>
        <p className="text-sm text-muted">Already registered? <Link to="/login" className="font-semibold text-brand">Sign in</Link></p>
      </form>
    </Shell>
  );
}

function Confirm() {
  const { userId } = useParams();
  const s = useStore();
  const u = s.users.find((x) => x.id === userId);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const done = useAfterLogin();
  if (!u) return <Shell title="Account not found"><Link to="/register" className="text-brand underline">Create an account</Link></Shell>;
  return (
    <Shell title="Verify your account" sub={`We sent a 6-digit code to ${u.phone ?? u.email}.`}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setErr(''); try { verifyAccount(u.id, code); toast('Verified. Welcome to Letsema!'); done(); } catch (e2) { setErr((e2 as Error).message); } }}>
        <Field label="Code" htmlFor="vc"><input id="vc" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field font-mono text-2xl tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{err}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Verify</Button>
          <button type="button" className="text-sm font-semibold text-brand" onClick={() => { resendVerification(u.id); toast('New code sent', 'info'); }}>Send a new code</button>
          <a href="#/inbox" target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand">Open demo inbox ↗</a>
        </div>
      </form>
    </Shell>
  );
}

function Forgot() {
  const nav = useNavigate();
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Shell title="Reset your password" sub="We send a one-time code to your verified email or phone.">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault(); setErr('');
        if (!sent) { forgotPassword(contact); setSent(true); toast('If that account exists, a code was sent.', 'info'); return; }
        try { resetPassword(contact, code, pw); toast('Password changed. Please sign in.'); nav('/login'); } catch (e2) { setErr((e2 as Error).message); }
      }}>
        <Field label="Email or mobile number" htmlFor="fc"><input id="fc" className="field" value={contact} onChange={(e) => setContact(e.target.value)} disabled={sent} /></Field>
        {sent && (<>
          <Field label="6-digit code" htmlFor="fcode"><input id="fcode" inputMode="numeric" className="field font-mono" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></Field>
          <Field label="New password" htmlFor="fpw" help={PASSWORD_RULES}><input id="fpw" type="password" autoComplete="new-password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        </>)}
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{err}</p>}
        <div className="flex items-center gap-3"><Button type="submit">{sent ? 'Change password' : 'Send code'}</Button>{sent && <a href="#/inbox" target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand">Open demo inbox ↗</a>}</div>
      </form>
    </Shell>
  );
}
