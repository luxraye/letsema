import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { EntryBody, Thread, EntryAudit } from '@/components/entry-body';
import { StatusBadge, Badge } from '@/components/ui';
import { calibrate, spread, DISAGREE } from '@/lib/scoring';
import { castVote, finalise } from '@/app/actions/judging';
import { Submit } from '@/components/forms';
import { pula } from '@/lib/instances';
import { can } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function PanelOne({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser({ perm: 'entry.viewAll' });
  const [row] = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(eq(schema.entries.id, id)).limit(1);
  if (!row) notFound();
  const { e, i } = row;
  const evs = await db.select({ ev: schema.evaluations, name: schema.users.name }).from(schema.evaluations).innerJoin(schema.users, eq(schema.users.id, schema.evaluations.evaluatorId)).where(eq(schema.evaluations.entryId, id));
  const all = await db.select({ entryId: schema.evaluations.entryId, evaluatorId: schema.evaluations.evaluatorId, total: schema.evaluations.total }).from(schema.evaluations);
  const cal = calibrate(all.filter((a) => a.total != null).map((a) => ({ ...a, total: a.total! })));
  const votes = await db.select({ v: schema.votes, name: schema.users.name }).from(schema.votes).innerJoin(schema.users, eq(schema.users.id, schema.votes.userId)).where(eq(schema.votes.entryId, id));
  const panel = await db.select().from(schema.instanceRoles).where(and(eq(schema.instanceRoles.instanceId, i.id), eq(schema.instanceRoles.role, 'panel')));
  const quorum = Math.floor(panel.length / 2) + 1;
  const mine = votes.find((v) => v.v.userId === me.id)?.v;
  const raw = evs.filter((x) => x.ev.total != null).map((x) => x.ev.total!);
  const decider = can(me.role, 'entry.decide');
  const awards = votes.filter((v) => v.v.vote === 'award').length; const declines = votes.filter((v) => v.v.vote === 'decline').length;
  return (
    <div>
      <Link href={decider ? '/dashboard/panel' : '/dashboard/pipeline'} className="text-sm text-muted hover:underline">← Back</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">{e.ref}</h1><StatusBadge status={e.status} />{e.rank && <Badge tone="brand">Rank #{e.rank}</Badge>}</div>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <EntryBody entry={e} def={i.definition} blind={false} />
          <div className="card p-5"><h3 className="mb-2 font-bold">Messages</h3><Thread entryId={id} showInternal /></div>
        </div>
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between"><div className="font-bold">Evaluator scores</div>{spread(raw) > DISAGREE && <Badge tone="red">Disagreement</Badge>}</div>
            <table className="mt-2 w-full text-sm"><thead className="text-xs text-muted"><tr><th className="text-left">Evaluator</th><th>Raw</th><th>Calibrated</th></tr></thead><tbody>{evs.map(({ ev, name }) => { const c = cal.find((x) => x.entryId === id && x.evaluatorId === ev.evaluatorId); return <tr key={ev.id} className="border-t border-line"><td className="py-1.5">{name}{ev.conflict && <Badge tone="gray">conflict</Badge>}</td><td className="text-center">{ev.total ?? '…'}</td><td className="text-center font-bold">{c?.calibrated ?? '–'}</td></tr>; })}</tbody></table>
            <p className="mt-2 text-xs text-muted">Calibrated scores adjust for each evaluator’s overall strictness across every application they scored.</p>
            <ul className="mt-3 space-y-2 text-xs">{evs.filter((x) => x.ev.feedback).map(({ ev }) => <li key={ev.id} className="rounded-lg bg-sand p-2">{ev.feedback}{ev.privateNote && <div className="mt-1 text-muted">Private: {ev.privateNote}</div>}</li>)}</ul>
          </div>
          <div className="card p-4"><div className="mb-2 font-bold">Tracking (audit log)</div><EntryAudit entryId={id} /></div>
          <div className="card p-4">
            <div className="font-bold">Panel votes ({votes.length} of {panel.length}; {quorum} needed)</div>
            <ul className="mt-2 space-y-1 text-sm">{votes.map(({ v, name }) => <li key={v.userId} className="flex justify-between gap-2"><span>{name}</span><span><Badge tone={v.vote === 'award' ? 'green' : v.vote === 'decline' ? 'red' : 'amber'}>{v.vote}</Badge>{v.amount ? ` ${pula(v.amount)}` : ''}</span></li>)}</ul>
          </div>
          {decider && e.status === 'shortlisted' && (
            <>
              <form action={castVote.bind(null, id)} className="card space-y-3 p-4">
                <div className="font-bold">{mine ? 'Change your vote' : 'Your vote'}</div>
                <fieldset className="grid grid-cols-3 gap-2 text-sm">{(['award', 'discuss', 'decline'] as const).map((v) => <label key={v} className="flex items-center justify-center gap-1 rounded-lg border border-line p-2 capitalize has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand)]/5"><input type="radio" name="vote" value={v} defaultChecked={(mine?.vote ?? 'award') === v} className="sr-only" />{v}</label>)}</fieldset>
                <div><label className="label" htmlFor="amount">Amount if awarded (Pula)</label><input id="amount" name="amount" className="field" inputMode="numeric" defaultValue={mine?.amount ?? Number(e.answers.funding ?? 100000)} /></div>
                <input name="note" className="field" placeholder="Reason (optional)" defaultValue={mine?.note ?? ''} />
                <Submit className="btn-primary w-full">Save vote</Submit>
              </form>
              <form action={finalise.bind(null, id)} className="card space-y-3 p-4">
                <div className="font-bold">Finalise</div>
                <p className="text-xs text-muted">{votes.length < quorum ? `Waiting for ${quorum - votes.length} more vote(s).` : awards === declines ? 'Tied: discuss and re-vote.' : `Majority says ${awards > declines ? 'award' : 'decline'}. The amount is the middle of the award votes.`}</p>
                <input name="note" className="field" placeholder="Decision note for the applicant" />
                <Submit className="btn-ghost w-full">Record the panel decision</Submit>
              </form>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
