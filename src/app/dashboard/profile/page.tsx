import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Badge } from '@/components/ui';
import { AddPasskey } from '@/components/passkey-buttons';
import { removePasskey, requestPrivacy, signOutEverywhere, updateAlerts } from '@/app/actions/account';
import { ProfileForm, PasswordForm } from './forms';
import { fmtDate, ago } from '@/lib/format';
import { Submit } from '@/components/forms';
import { DISTRICTS } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';

export default async function Profile() {
  const me = await requireUser();
  const [keys, sessions, requests] = await Promise.all([
    db.select().from(schema.passkeys).where(eq(schema.passkeys.userId, me.id)),
    db.select().from(schema.sessions).where(eq(schema.sessions.userId, me.id)).orderBy(desc(schema.sessions.createdAt)),
    db.select().from(schema.privacyRequests).where(eq(schema.privacyRequests.userId, me.id)).orderBy(desc(schema.privacyRequests.createdAt)),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Profile and security" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Your details</h2><ProfileForm me={{ name: me.name, email: me.email, phone: me.phone ?? '', district: me.district ?? '', dateOfBirth: me.dateOfBirth ?? '', gender: me.gender ?? '', omang: me.omang ?? '', organisation: me.organisation ?? '', cipaNumber: me.cipaNumber ?? '', youthShare: me.youthShare ?? '' }} districts={DISTRICTS} verified={{ email: !!me.emailVerifiedAt, phone: !!me.phoneVerifiedAt }} /></section>
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-1 text-lg font-bold">Sign-in</h2>
            <p className="mb-3 text-sm text-muted">Use a password, a one-time code by email or SMS, or a passkey (fingerprint, face or device PIN).</p>
            <div className="mb-4"><div className="mb-2 text-sm font-semibold">Passkeys</div>{keys.length ? <ul className="mb-3 space-y-1 text-sm">{keys.map((k) => <li key={k.id} className="flex items-center justify-between rounded-lg bg-sand px-3 py-2"><span>{k.label} · added {fmtDate(k.createdAt)}</span><form action={removePasskey.bind(null, k.id)}><button className="text-xs underline">Remove</button></form></li>)}</ul> : <p className="mb-2 text-sm text-muted">None yet.</p>}<AddPasskey /></div>
            <PasswordForm />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">Alerts</h2>
            <form action={updateAlerts} className="space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="inapp" defaultChecked={me.alerts.inapp} /> In the portal</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="email" defaultChecked={me.alerts.email} /> Email to {me.email}</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="sms" defaultChecked={me.alerts.sms} disabled={!me.phone} /> SMS {me.phone ? `to ${me.phone}` : '(add a phone number first)'}</label>
              <p className="text-xs text-muted">Alerts are free. We only message you about your own applications.</p>
              <Submit className="btn-ghost">Save alerts</Submit>
            </form>
          </section>
        </div>
      </div>
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-bold">Where you are signed in</h2>
        <ul className="mb-3 space-y-1 text-sm">{sessions.map((s) => <li key={s.id} className="text-muted">{s.method} · {s.userAgent?.slice(0, 70) ?? 'Unknown device'} · {ago(s.createdAt)}</li>)}</ul>
        <form action={signOutEverywhere}><button className="btn-ghost">Sign out on every device</button></form>
      </section>
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-bold">Your data</h2>
        <p className="mb-3 text-sm text-muted">Under the Data Protection Act 2024 you can get a copy of your data, ask us to correct it, or ask us to erase it. We reply within 30 days.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/me/export" className="btn-ghost">Download my data now</a>
          <form action={requestPrivacy}><input type="hidden" name="kind" value="correct" /><button className="btn-ghost">Ask for a correction</button></form>
          <form action={requestPrivacy}><input type="hidden" name="kind" value="erase" /><button className="btn-ghost text-rose-700">Ask to erase my account</button></form>
        </div>
        {requests.length > 0 && <ul className="mt-3 space-y-1 text-sm">{requests.map((r) => <li key={r.id}>{r.kind} request · <Badge tone={r.status === 'open' ? 'amber' : r.status === 'done' ? 'green' : 'red'}>{r.status}</Badge> · due {fmtDate(r.dueAt)}</li>)}</ul>}
      </section>
    </div>
  );
}
