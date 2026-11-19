import { notFound } from 'next/navigation';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { StatusBadge } from '@/components/ui';
import { EntryBody, Thread, EntryAudit } from '@/components/entry-body';
import { screen } from '@/app/actions/judging';
import { postMessage } from '@/app/actions/entries';
import { Submit } from '@/components/forms';
import { checkEligibility, ageFrom } from '@/lib/eligibility';

export const dynamic = 'force-dynamic';

export default async function ScreenOne({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser({ perm: 'entry.screen' });
  const [row] = await db.select({ e: schema.entries, i: schema.instances, u: schema.users }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).innerJoin(schema.users, eq(schema.users.id, schema.entries.innovatorId)).where(eq(schema.entries.id, id)).limit(1);
  if (!row || (me.role === 'partner_admin' && row.i.spaceId !== me.spaceId)) notFound();
  const { e, i, u } = row;
  const checks = await db.select().from(schema.checks).where(eq(schema.checks.entryId, id));
  const elig = checkEligibility(i.definition, { age: ageFrom(u.dateOfBirth), citizen: !!u.omang, youthShare: u.youthShare ?? undefined, cipa: !!u.cipaNumber, staff: u.organisation === 'CEDA' });
  const act = screen.bind(null, id);
  const say = postMessage.bind(null, id);
  return (
    <div>
      <Link href="/dashboard/screening" className="text-sm text-muted hover:underline">← Screening</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-extrabold">{e.ref}</h1><StatusBadge status={e.status} /><span className="text-sm text-muted">{i.name}</span></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <EntryBody entry={e} def={i.definition} blind={false} />
        <aside className="space-y-4">
          <div className="card p-4 text-sm">
            <div className="font-bold">Applicant</div>
            <div className="mt-1">{u.name} · {u.district ?? '–'}</div><div className="text-muted">{u.organisation ?? '–'} · CIPA {u.cipaNumber ?? 'missing'} · youth-owned {u.youthShare ?? '?'}%</div>
            <div className="mt-3 font-bold">Eligibility from profile</div>
            <ul className="mt-1 space-y-1">{elig.reasons.map((r) => <li key={r.text} className="flex items-center gap-2">{r.ok ? <CheckCircle2 size={15} className="text-emerald-600" /> : <XCircle size={15} className="text-rose-600" />}{r.text}</li>)}</ul>
            <div className="mt-3 font-bold">Automatic checks</div>
            <ul className="mt-1 space-y-1">{checks.map((c) => <li key={c.id} className="flex gap-2">{c.status === 'pass' ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />}<span>{c.label}<span className="block text-xs text-muted">{c.detail}</span></span></li>)}</ul>
          </div>
          {['submitted', 'screening'].includes(e.status) && (
            <form action={act} className="card space-y-3 p-4">
              <div className="font-bold">Decision</div>
              <fieldset className="space-y-2 text-sm">
                <label className="flex gap-2"><input type="radio" name="decision" value="pass" defaultChecked /> Pass: send to {i.definition.reviewersPerEntry} evaluators</label>
                <label className="flex gap-2"><input type="radio" name="decision" value="return" /> Ask the applicant for changes</label>
                <label className="flex gap-2"><input type="radio" name="decision" value="reject" /> Decline: not eligible</label>
              </fieldset>
              <textarea name="note" className="field min-h-24" placeholder="Message to the applicant (required when asking for changes)" />
              <Submit className="btn-primary w-full">Record decision</Submit>
            </form>
          )}
          <div className="card p-4"><div className="mb-2 font-bold">Tracking (audit log)</div><EntryAudit entryId={id} /></div>
          <div className="card space-y-3 p-4">
            <div className="font-bold">Messages</div>
            <Thread entryId={id} showInternal />
            <form action={say} className="space-y-2"><textarea name="body" className="field min-h-20" placeholder="Write to the applicant, or tick ‘internal’ for a staff note" required /><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="internal" /> Internal note (applicant cannot see it)</label><Submit className="btn-ghost w-full">Send</Submit></form>
          </div>
        </aside>
      </div>
    </div>
  );
}
