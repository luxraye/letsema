import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { EntryBody } from '@/components/entry-body';
import { declareConflict, submitScores } from '@/app/actions/judging';
import { Submit } from '@/components/forms';
import { ScoreForm } from './score-form';

export const dynamic = 'force-dynamic';

export default async function ReviewOne({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser({ perm: 'entry.review' });
  const [row] = await db.select({ ev: schema.evaluations, e: schema.entries, i: schema.instances }).from(schema.evaluations).innerJoin(schema.entries, eq(schema.entries.id, schema.evaluations.entryId)).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(and(eq(schema.evaluations.id, id), eq(schema.evaluations.evaluatorId, me.id))).limit(1);
  if (!row) notFound();
  const { ev, e, i } = row;
  if (ev.conflict === null) {
    return (
      <div className="mx-auto max-w-xl">
        <Link href="/dashboard/review" className="text-sm text-muted hover:underline">← Scoring queue</Link>
        <form action={declareConflict.bind(null, id)} className="card mt-3 space-y-4 p-6">
          <h1 className="text-2xl font-bold">Before you read it</h1>
          <p className="text-sm text-muted">Application in <b>{i.name}</b>, sector <b>{e.sector ?? '–'}</b>, from <b>{e.district ?? '–'}</b>. Do you have a conflict of interest? For example: you know the applicant, you work with them or a competitor, or you would benefit from the result.</p>
          <fieldset className="space-y-2 text-sm"><label className="flex gap-2"><input type="radio" name="conflict" value="no" defaultChecked /> No conflict. I can score this fairly.</label><label className="flex gap-2"><input type="radio" name="conflict" value="yes" /> Yes, I have a conflict. Give it to someone else.</label></fieldset>
          <input name="note" className="field" placeholder="Optional note for the programme team" />
          <Submit>Confirm</Submit>
          <p className="text-xs text-muted">Your answer is recorded in the audit trail.</p>
        </form>
      </div>
    );
  }
  return (
    <div>
      <Link href="/dashboard/review" className="text-sm text-muted hover:underline">← Scoring queue</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <EntryBody entry={e} def={i.definition} blind />
        <aside className="lg:sticky lg:top-20 lg:self-start">
          {ev.submittedAt ? (
            <div className="card p-5"><div className="text-sm text-muted">Your score</div><div className="text-4xl font-bold">{ev.total}<span className="text-lg text-muted"> / 100</span></div><ul className="mt-3 space-y-1 text-sm">{i.definition.rubric.map((c) => <li key={c.key} className="flex justify-between gap-3"><span>{c.label}</span><b>{ev.scores?.[c.key]}/10</b></li>)}</ul><p className="mt-3 rounded-xl bg-sand p-3 text-sm">{ev.feedback}</p></div>
          ) : <ScoreForm action={submitScores.bind(null, id)} rubric={i.definition.rubric} />}
        </aside>
      </div>
    </div>
  );
}
