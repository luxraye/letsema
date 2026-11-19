import { useState } from 'react';
import { Download, Fingerprint, KeyRound, Bell, Trash2, UserRound } from 'lucide-react';
import { useMe, PageHeader, Section, Button, Field, attempt, toast, Badge } from '../../ui/kit';
import { addPasskey, changePassword, exportMyData, PASSWORD_RULES, requestPrivacy, setAlertPrefs, updateProfile } from '../../core/actions';
import { download, fmtDate } from '../../core/util';

export default function Profile() {
  const me = useMe()!;
  const [p, setP] = useState({ name: me.name, phone: me.phone ?? '', org: me.org ?? '', district: me.district ?? '' });
  const [pw, setPw] = useState({ old: '', next: '' });
  const [note, setNote] = useState('');
  const createPasskey = async () => {
    if (!window.PublicKeyCredential) return toast('This browser does not support passkeys.', 'err');
    try {
      const cred = (await navigator.credentials.create({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Letsema' },
        user: { id: new TextEncoder().encode(me.id), name: me.email, displayName: me.name },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        timeout: 60000,
      } })) as PublicKeyCredential | null;
      if (cred) attempt(() => addPasskey(me, cred.id, `${navigator.platform || 'This device'} · ${new Date().toLocaleDateString()}`), 'Passkey added. You can now sign in with fingerprint, face or PIN.');
    } catch { toast('Passkey setup was cancelled or is not available on this device.', 'err'); }
  };
  return (
    <div>
      <PageHeader title="Profile & security" sub="Your details, sign-in methods, alerts and your data." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={<span className="flex items-center gap-2"><UserRound size={18} /> Your details</span>}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); attempt(() => updateProfile(me, p), 'Profile saved'); }}>
            <Field label="Full name" htmlFor="pn"><input id="pn" className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
            <Field label="Email" htmlFor="pe" help="Contact CEDA to change a verified email."><input id="pe" className="field" value={me.email} disabled /></Field>
            <Field label="Mobile" htmlFor="pp"><input id="pp" className="field" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
            <Field label="Company / organisation" htmlFor="po"><input id="po" className="field" value={p.org} onChange={(e) => setP({ ...p, org: e.target.value })} /></Field>
            <Button type="submit">Save</Button>
          </form>
        </Section>
        <div className="space-y-5">
          <Section title={<span className="flex items-center gap-2"><KeyRound size={18} /> Change password</span>}>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (attempt(() => changePassword(me, pw.old, pw.next), 'Password changed') !== undefined) setPw({ old: '', next: '' }); }}>
              <Field label="Current password" htmlFor="op"><input id="op" type="password" autoComplete="current-password" className="field" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></Field>
              <Field label="New password" htmlFor="np" help={PASSWORD_RULES}><input id="np" type="password" autoComplete="new-password" className="field" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
              <Button type="submit">Change password</Button>
            </form>
          </Section>
          <Section title={<span className="flex items-center gap-2"><Fingerprint size={18} /> Passkeys (fingerprint / face)</span>} sub="A passkey can’t be phished or reused. Your fingerprint or face never leaves your device.">
            <ul className="mb-3 space-y-1 text-sm">{me.passkeys.map((k) => <li key={k.id} className="flex items-center gap-2"><Badge tone="emerald">active</Badge>{k.label} <span className="text-muted">added {fmtDate(k.createdAt)}</span></li>)}{!me.passkeys.length && <li className="text-muted">No passkeys yet.</li>}</ul>
            <Button variant="secondary" onClick={createPasskey}><Fingerprint size={16} /> Add a passkey</Button>
          </Section>
        </div>
        <Section title={<span id="alerts" className="flex items-center gap-2"><Bell size={18} /> Free alerts</span>} sub="We tell you whenever something changes on your ideas. No charge on any channel.">
          {(['inapp', 'email', 'sms'] as const).map((k) => (
            <label key={k} className="flex items-center justify-between border-b border-line py-2.5 text-sm last:border-0">
              {k === 'inapp' ? 'In the portal (bell)' : k === 'email' ? `Email to ${me.email}` : me.phone ? `SMS to ${me.phone}` : 'SMS (add a mobile number first)'}
              <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" disabled={k === 'sms' && !me.phone} checked={me.alerts[k]} onChange={(e) => attempt(() => setAlertPrefs(me, { ...me.alerts, [k]: e.target.checked }), 'Alert settings saved')} />
            </label>
          ))}
        </Section>
        <Section title="Your data" sub="Your rights under the Data Protection Act, 2024.">
          <p className="text-sm text-muted">Consent recorded {fmtDate(me.consentAt)}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { const json = exportMyData(me); download(`letsema-my-data-${me.id}.json`, json, 'application/json'); toast('Your data was downloaded'); }}><Download size={15} /> Download my data</Button>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <Field label="Ask for a correction or erasure" htmlFor="pr"><textarea id="pr" className="field min-h-16" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should we correct, or why do you want your data erased?" /></Field>
            <div className="mt-2 flex gap-2"><Button size="sm" variant="secondary" onClick={() => { if (attempt(() => requestPrivacy(me, 'correct', note), 'Correction request sent') !== undefined) setNote(''); }}>Request correction</Button><Button size="sm" variant="danger" onClick={() => { if (attempt(() => requestPrivacy(me, 'erase', note), 'Erasure request sent to the Data Protection Officer') !== undefined) setNote(''); }}><Trash2 size={14} /> Request erasure</Button></div>
          </div>
        </Section>
      </div>
    </div>
  );
}
