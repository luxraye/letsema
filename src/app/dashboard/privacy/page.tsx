import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Badge, Stat } from '@/components/ui';
import { resolvePrivacy } from '@/app/actions/account';
import { fmtDate } from '@/lib/format';
import { Submit } from '@/components/forms';

export const dynamic = 'force-dynamic';

export default async function PrivacyDesk() {
  await requireUser({ perm: 'privacy.manage' });
  const rows = await db.select({ r: schema.privacyRequests, name: schema.users.name, email: schema.users.email }).from(schema.privacyRequests).leftJoin(schema.users, eq(schema.users.id, schema.privacyRequests.userId)).orderBy(desc(schema.privacyRequests.createdAt));
  const [consented] = await db.select({ n: db.$count(schema.users) }).from(schema.users).limit(1);
  const open = rows.filter((x) => x.r.status === 'open');
  return (
    <div>
      <PageHeader title="Data protection" sub="Requests under the Data Protection Act 2024, and the safeguards built into the portal." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3"><Stat label="Open requests" value={open.length} /><Stat label="Overdue" value={open.filter((x) => x.r.dueAt < new Date()).length} /><Stat label="Accounts with recorded consent" value={consented?.n ?? 0} /></div>
      <div className="card mb-6 p-5 text-sm">
        <h2 className="mb-2 font-bold">Safeguards in place</h2>
        <ul className="grid gap-1 sm:grid-cols-2">{['Consent recorded with date at sign-up', 'Evaluators score blind; names hidden', 'Passwords hashed (bcrypt); codes stored only as hashes', 'Sessions are server-side and can be revoked', 'Account lock after 5 wrong passwords', 'Files checked for real type and leaked secrets', 'Self-service data download (JSON)', 'Erasure by pseudonymisation; decisions kept anonymously', 'Every access to personal data is in the audit trail', 'Security headers, HTTPS only, no third-party trackers'].map((x) => <li key={x}>✓ {x}</li>)}</ul>
      </div>
      <div className="card divide-y divide-line">
        {rows.map(({ r, name, email }) => (
          <div key={r.id} className="flex flex-wrap items-start gap-3 p-4">
            <div className="min-w-0 flex-1"><div className="font-semibold capitalize">{r.kind} · {name}</div><div className="text-xs text-muted">{email} · asked {fmtDate(r.createdAt)} · due {fmtDate(r.dueAt)}</div>{r.note && <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.note}</p>}</div>
            {r.status === 'open' ? (
              <form action={resolvePrivacy.bind(null, r.id)} className="flex flex-wrap gap-2"><input name="reply" className="field !w-56 !py-1.5" placeholder="Reply (optional)" /><select name="outcome" className="field !w-32 !py-1.5"><option value="done">Complete</option><option value="refuse">Refuse</option></select><Submit className="btn-primary !py-1.5">Record</Submit></form>
            ) : <Badge tone={r.status === 'done' ? 'green' : 'red'}>{r.status}</Badge>}
          </div>
        ))}
        {!rows.length && <p className="p-4 text-sm text-muted">No requests yet.</p>}
      </div>
    </div>
  );
}
