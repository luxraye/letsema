import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Award, Pencil, Receipt } from 'lucide-react';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { StatusBadge, Notice, Avatar } from '@/components/ui';
import { STATUS, fmtDateTime, ago } from '@/lib/format';
import { pula } from '@/lib/instances';
import { wordDiff } from '@/lib/diff';
import { postMessage, withdrawEntry } from '@/app/actions/entries';
import { Submit } from '@/components/forms';

export const dynamic = 'force-dynamic';

const JOURNEY = ['submitted', 'screening', 'in_review', 'shortlisted', 'awarded'] as const;

export default async function Passport({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ submitted?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const me = await requireUser({ perm: 'entry.create' });
  const [row] = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(and(eq(schema.entries.id, id), eq(schema.entries.innovatorId, me.id))).limit(1);
  if (!row) notFound();
  const { e, i } = row;
  const [checks, thread, versions, evals] = await Promise.all([
    db.select().from(schema.checks).where(eq(schema.checks.entryId, id)),
    db.select({ m: schema.messages, author: schema.users.name, role: schema.users.role }).from(schema.messages).innerJoin(schema.users, eq(schema.users.id, schema.messages.authorId)).where(and(eq(schema.messages.entryId, id), eq(schema.messages.internal, false))).orderBy(asc(schema.messages.createdAt)),
    db.select().from(schema.entryVersions).where(eq(schema.entryVersions.entryId, id)).orderBy(desc(schema.entryVersions.version)),
    db.select({ feedback: schema.evaluations.feedback, total: schema.evaluations.total }).from(schema.evaluations).where(and(eq(schema.evaluations.entryId, id), isNotNull(schema.evaluations.submittedAt))),
  ]);
  const showScores = ['awarded', 'declined', 'returned'].includes(e.status);
  const idx = e.status === 'returned' ? 2 : e.status === 'declined' ? 3 : JOURNEY.indexOf(e.status as (typeof JOURNEY)[number]);
  const [latest, previous] = versions;
  const send = postMessage.bind(null, id);
  const withdraw = withdrawEntry.bind(null, id);
  const label = (k: string) => i.definition.form.find((f) => f.key === k)?.label ?? k;

  return (
    <div className="space-y-6">
      {sp.submitted && <Notice tone="green"><b>Submitted and sealed.</b> Your reference is <span className="mono font-bold">{e.ref}</span>. We emailed you a receipt. Anyone can track it on the public tracker, and you will get alerts at every step.</Notice>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-sm text-muted">{i.name}</div><h1 className="text-3xl font-extrabold">{e.title}</h1><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={e.status} /><span className="mono text-sm text-muted">{e.ref}</span>{e.version > 0 && <span className="text-sm text-muted">· version {e.version}</span>}</div></div>
        <div className="flex flex-wrap gap-2">
          {(e.status === 'draft' || e.status === 'returned') && <Link href={`/dashboard/entries/${id}/edit`} className="btn-primary"><Pencil size={16} /> {e.status === 'returned' ? 'Update and resubmit' : 'Continue'}</Link>}
          {e.status === 'awarded' && <Link href={`/certificate/${e.ref}`} className="btn-primary"><Award size={16} /> Certificate</Link>}
          <Link href={`/track?ref=${e.ref}`} className="btn-ghost">Public tracker</Link>
        </div>
      </div>

      {e.status !== 'draft' && e.status !== 'withdrawn' && (
        <div className="card p-5">
          <div className="mb-4 font-bold">Where it is now</div>
          <ol className="grid gap-2 sm:grid-cols-5">
            {JOURNEY.map((s, n) => {
              const state = e.status === 'declined' && n === 3 ? 'stop' : n < idx ? 'done' : n === idx ? 'now' : 'todo';
              return <li key={s} className={`rounded-xl border p-3 text-sm ${state === 'now' ? 'border-[var(--brand)] bg-[var(--brand)]/5' : state === 'done' ? 'border-emerald-200 bg-emerald-50' : state === 'stop' ? 'border-rose-200 bg-rose-50' : 'border-line text-muted'}`}><div className="font-semibold">{state === 'stop' ? 'Not funded' : STATUS[s].label}</div><div className="text-xs">{state === 'done' ? 'Done' : state === 'now' ? 'Now' : state === 'stop' ? 'Decision made' : 'Next'}</div></li>;
            })}
          </ol>
          <p className="mt-3 text-sm text-muted">{STATUS[e.status]?.plain}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {e.status === 'awarded' && <div className="card border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-lg font-bold"><Award className="text-emerald-700" /> Awarded {pula(e.awardAmount)}</div><p className="mt-1 text-sm">{e.decisionNote}</p><p className="mt-2 text-sm">Verification code <span className="mono font-bold">{e.awardCode}</span>. Anyone can check it at <Link className="underline" href={`/verify/${e.ref}/${e.awardCode}`}>/verify</Link>.</p></div>}
          {e.status === 'declined' && <div className="card p-5"><div className="text-lg font-bold">Not funded this round</div><p className="mt-1 text-sm text-muted">{e.decisionNote}</p></div>}
          {showScores && evals.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-1 text-lg font-bold">Evaluator feedback</h2>
              <p className="mb-3 text-sm text-muted">From {evals.length} independent evaluators. Names are not shown.{e.score != null && <> Average score <b>{e.score}</b> / 100.</>}</p>
              <ul className="space-y-2">{evals.map((v, n) => <li key={n} className="rounded-xl bg-sand/60 p-3 text-sm"><b>Evaluator {String.fromCharCode(65 + n)}</b>: {v.feedback}</li>)}</ul>
            </section>
          )}
          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">Messages with CEDA</h2>
            <div className="space-y-3">
              {thread.length === 0 && <p className="text-sm text-muted">No messages yet. Ask anything about your application here.</p>}
              {thread.map(({ m, author, role }) => (
                <div key={m.id} className={`flex gap-3 ${m.authorId === me.id ? 'flex-row-reverse text-right' : ''}`}>
                  {m.kind !== 'system' && <Avatar name={author} size={30} />}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.kind === 'system' ? 'mx-auto bg-transparent text-xs text-muted' : m.kind === 'revision_request' ? 'border border-orange-200 bg-orange-50 text-left' : m.authorId === me.id ? 'bg-[var(--brand)] text-white' : 'bg-sand text-left'}`}>
                    {m.kind === 'revision_request' && <div className="mb-1 text-xs font-bold uppercase text-orange-800">Changes requested</div>}
                    {m.body}
                    {m.kind !== 'system' && <div className={`mt-1 text-[11px] ${m.authorId === me.id ? 'text-white/70' : 'text-muted'}`}>{m.authorId === me.id ? 'You' : `${author}${role !== 'innovator' ? ', CEDA' : ''}`} · {ago(m.createdAt)}</div>}
                  </div>
                </div>
              ))}
            </div>
            {!['withdrawn'].includes(e.status) && <form action={send} className="mt-4 flex gap-2"><input name="body" className="field" placeholder="Write a message" required maxLength={3000} /><Submit className="btn-primary">Send</Submit></form>}
          </section>
          {latest && previous && (
            <section className="card p-5">
              <h2 className="mb-1 text-lg font-bold">What changed in version {latest.version}</h2>
              <p className="mb-3 text-sm text-muted"><span className="rounded bg-emerald-100 px-1">Added</span> and <span className="rounded bg-rose-100 px-1 line-through">removed</span> words since version {previous.version}.</p>
              {Object.keys({ ...previous.answers, ...latest.answers }).filter((k) => (previous.answers[k] ?? '') !== (latest.answers[k] ?? '')).map((k) => (
                <div key={k} className="mb-3"><div className="text-sm font-semibold">{label(k)}</div><p className="mt-1 text-sm leading-relaxed">{wordDiff(previous.answers[k] ?? '', latest.answers[k] ?? '').map((p, n) => <span key={n} className={p.t === 'add' ? 'rounded bg-emerald-100' : p.t === 'del' ? 'rounded bg-rose-100 line-through' : ''}>{p.s}</span>)}</p></div>
              ))}
            </section>
          )}
          {e.status !== 'draft' && (
            <section className="card p-5">
              <h2 className="mb-3 text-lg font-bold">Your answers (version {e.version})</h2>
              <dl className="space-y-3 text-sm">{i.definition.form.filter((f) => f.type !== 'file').map((f) => <div key={f.key}><dt className="font-semibold">{f.label}</dt><dd className="whitespace-pre-line text-muted">{e.answers[f.key] || '–'}</dd></div>)}</dl>
            </section>
          )}
        </div>
        <aside className="space-y-4">
          {e.sealHash && (
            <div className="card p-4 text-sm">
              <div className="flex items-center gap-2 font-bold"><Receipt size={16} /> Receipt</div>
              <dl className="mt-2 space-y-1.5"><div><dt className="text-xs text-muted">Reference</dt><dd className="mono font-bold">{e.ref}</dd></div><div><dt className="text-xs text-muted">Submitted</dt><dd>{fmtDateTime(e.submittedAt)}</dd></div><div><dt className="text-xs text-muted">Seal (fingerprint of your answers and files)</dt><dd className="mono break-all text-[11px]">{e.sealHash}</dd></div><div><dt className="text-xs text-muted">Rules you applied under</dt><dd className="mono break-all text-[11px]">{e.rulesHashAtSubmit}</dd></div></dl>
            </div>
          )}
          {checks.length > 0 && (
            <div className="card p-4 text-sm">
              <div className="flex items-center gap-2 font-bold"><ShieldCheck size={16} /> Automatic checks</div>
              <ul className="mt-2 space-y-2">{checks.map((c) => <li key={c.id} className="flex gap-2">{c.status === 'pass' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> : c.status === 'warn' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />}<span><b>{c.label}</b><span className="block text-xs text-muted">{c.detail}</span></span></li>)}</ul>
            </div>
          )}
          {!['awarded', 'declined', 'withdrawn'].includes(e.status) && <form action={withdraw}><button className="w-full text-sm text-muted underline">Withdraw this application</button></form>}
        </aside>
      </div>
    </div>
  );
}
