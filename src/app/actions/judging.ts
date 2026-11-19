'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { appendAudit } from '@/lib/audit';
import { awardCode } from '@/lib/award';
import { alertFollowers, notify, notifyMany } from '@/lib/notify';
import { calibrate, leaderboard, weightedTotal } from '@/lib/scoring';
import { requireUser } from '@/lib/session';
import { pula } from '@/lib/instances';

const DAY = 86400_000;

async function entryWithInstance(entryId: string) {
  const [row] = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(eq(schema.entries.id, entryId)).limit(1);
  if (!row) throw new Error('Not found');
  return row;
}

/** Partner admins may only act on their own space's Instances. */
async function assertScope(me: { role: string; spaceId: string | null }, instanceSpaceId: string) {
  if (me.role === 'partner_admin' && me.spaceId !== instanceSpaceId) throw new Error('This Instance belongs to another space.');
}

/** Pick evaluators with the lightest current load who have not declared a conflict on this entry. */
async function assignEvaluators(entryId: string, instanceId: string, count: number, byId: string, exclude: string[] = []) {
  const pool = await db.select({ id: schema.users.id }).from(schema.instanceRoles).innerJoin(schema.users, eq(schema.users.id, schema.instanceRoles.userId)).where(and(eq(schema.instanceRoles.instanceId, instanceId), eq(schema.instanceRoles.role, 'evaluator')));
  const already = await db.select({ id: schema.evaluations.evaluatorId }).from(schema.evaluations).where(eq(schema.evaluations.entryId, entryId));
  const taken = new Set([...already.map((a) => a.id), ...exclude]);
  const load = await db.select({ id: schema.evaluations.evaluatorId, n: sql<number>`count(*)::int` }).from(schema.evaluations).where(isNull(schema.evaluations.submittedAt)).groupBy(schema.evaluations.evaluatorId);
  const l = new Map(load.map((x) => [x.id, x.n]));
  const chosen = pool.filter((p) => !taken.has(p.id)).sort((a, b) => (l.get(a.id) ?? 0) - (l.get(b.id) ?? 0) || a.id.localeCompare(b.id)).slice(0, count);
  for (const c of chosen) await db.insert(schema.evaluations).values({ entryId, evaluatorId: c.id, dueAt: new Date(Date.now() + 7 * DAY) });
  if (chosen.length) await notifyMany(chosen.map((c) => c.id), 'New application to score', 'An application was added to your scoring queue. Please declare any conflict of interest first.', '/dashboard/review');
  return chosen.length;
}

export async function screen(entryId: string, fd: FormData) {
  const me = await requireUser({ perm: 'entry.screen' });
  const decision = String(fd.get('decision'));
  const note = String(fd.get('note') ?? '').trim().slice(0, 2000);
  const { e, i } = await entryWithInstance(entryId);
  await assertScope(me, i.spaceId);
  if (!['submitted', 'screening'].includes(e.status)) return;
  if (decision === 'pass') {
    const n = await assignEvaluators(entryId, i.id, i.definition.reviewersPerEntry, me.id);
    await db.update(schema.entries).set({ status: 'in_review', updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.screened', instanceId: i.id, entryId, detail: { ref: e.ref, outcome: 'passed' } });
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.assigned', instanceId: i.id, entryId, detail: { ref: e.ref, evaluators: n } });
    await notify(e.innovatorId, `${e.ref} passed screening`, 'Your application is now with independent evaluators.', `/dashboard/entries/${entryId}`);
    await alertFollowers(entryId, e.ref, 'Passed screening', 'It is now with independent evaluators.');
  } else if (decision === 'return') {
    if (!note) return;
    await db.update(schema.entries).set({ status: 'returned', updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
    await db.insert(schema.messages).values({ entryId, authorId: me.id, kind: 'revision_request', body: note });
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.returned', instanceId: i.id, entryId, detail: { ref: e.ref } });
    await notify(e.innovatorId, `Changes requested on ${e.ref}`, note.slice(0, 200), `/dashboard/entries/${entryId}/edit`);
    await alertFollowers(entryId, e.ref, 'Changes requested', 'CEDA asked the applicant for changes.');
  } else if (decision === 'reject') {
    await db.update(schema.entries).set({ status: 'declined', decisionNote: note || 'Did not meet the eligibility rules for this competition.', decidedAt: new Date(), updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.declined', instanceId: i.id, entryId, detail: { ref: e.ref, stage: 'screening' } });
    await notify(e.innovatorId, `Decision on ${e.ref}`, note || 'Your application did not meet the eligibility rules.', `/dashboard/entries/${entryId}`);
    await alertFollowers(entryId, e.ref, 'Decision made', 'A decision has been made.');
  }
  revalidatePath('/dashboard/screening');
  redirect('/dashboard/screening');
}

export async function declareConflict(evalId: string, fd: FormData) {
  const me = await requireUser({ perm: 'entry.review' });
  const [ev] = await db.select().from(schema.evaluations).where(and(eq(schema.evaluations.id, evalId), eq(schema.evaluations.evaluatorId, me.id))).limit(1);
  if (!ev || ev.submittedAt) return;
  const conflict = fd.get('conflict') === 'yes';
  const note = String(fd.get('note') ?? '').slice(0, 500);
  await db.update(schema.evaluations).set({ conflict, conflictNote: note || null }).where(eq(schema.evaluations.id, evalId));
  const { e, i } = await entryWithInstance(ev.entryId);
  await appendAudit({ actorId: me.id, actorName: me.name, action: conflict ? 'evaluation.conflict_declared' : 'evaluation.no_conflict', instanceId: i.id, entryId: e.id, detail: { ref: e.ref } });
  if (conflict) {
    const n = await assignEvaluators(e.id, i.id, 1, me.id, [me.id]);
    await appendAudit({ actorId: me.id, actorName: 'System', action: 'evaluation.reassigned', instanceId: i.id, entryId: e.id, detail: { ref: e.ref, replaced: n } });
    revalidatePath('/dashboard/review');
    redirect('/dashboard/review?reassigned=1');
  }
  revalidatePath(`/dashboard/review/${evalId}`);
}

export async function submitScores(evalId: string, fd: FormData) {
  const me = await requireUser({ perm: 'entry.review' });
  const [ev] = await db.select().from(schema.evaluations).where(and(eq(schema.evaluations.id, evalId), eq(schema.evaluations.evaluatorId, me.id))).limit(1);
  if (!ev || ev.conflict !== false || ev.submittedAt) return;
  const { e, i } = await entryWithInstance(ev.entryId);
  const scores: Record<string, number> = {};
  for (const c of i.definition.rubric) { const v = Number(fd.get(`s_${c.key}`)); if (!Number.isFinite(v) || v < 0 || v > 10) return; scores[c.key] = Math.round(v); }
  const feedback = String(fd.get('feedback') ?? '').trim();
  if (feedback.length < 20) return;
  const total = weightedTotal(i.definition.rubric, scores);
  await db.update(schema.evaluations).set({ scores, total, feedback: feedback.slice(0, 3000), privateNote: String(fd.get('private') ?? '').slice(0, 2000) || null, submittedAt: new Date() }).where(eq(schema.evaluations.id, evalId));
  const done = await db.select({ total: schema.evaluations.total }).from(schema.evaluations).where(and(eq(schema.evaluations.entryId, e.id), isNotNull(schema.evaluations.submittedAt)));
  const avg = done.reduce((s, d) => s + (d.total ?? 0), 0) / done.length;
  await db.update(schema.entries).set({ score: Math.round(avg * 10) / 10, updatedAt: new Date() }).where(eq(schema.entries.id, e.id));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'evaluation.submitted', instanceId: i.id, entryId: e.id, detail: { ref: e.ref, total } });
  revalidatePath('/dashboard/review');
  redirect('/dashboard/review?scored=1');
}

/** Close scoring for an Instance: calibrate, rank reproducibly, shortlist the top N, and record the leaderboard fingerprint. */
export async function shortlist(instanceId: string) {
  const me = await requireUser({ perm: 'entry.screen' });
  const [i] = await db.select().from(schema.instances).where(eq(schema.instances.id, instanceId));
  await assertScope(me, i.spaceId);
  const evs = await db.select({ entryId: schema.evaluations.entryId, evaluatorId: schema.evaluations.evaluatorId, total: schema.evaluations.total }).from(schema.evaluations).innerJoin(schema.entries, eq(schema.entries.id, schema.evaluations.entryId)).where(and(eq(schema.entries.instanceId, instanceId), isNotNull(schema.evaluations.total)));
  const cal = calibrate(evs.map((e) => ({ ...e, total: e.total! })));
  const entries = await db.select().from(schema.entries).where(and(eq(schema.entries.instanceId, instanceId), eq(schema.entries.status, 'in_review')));
  const board = leaderboard(entries.map((e) => ({ entryId: e.id, ref: e.ref, title: e.title, submittedAt: e.submittedAt, totals: cal.filter((c) => c.entryId === e.id).map((c) => c.calibrated) })));
  const top = board.standings.slice(0, i.definition.shortlistSize);
  for (const s of board.standings) await db.update(schema.entries).set({ rank: s.rank, score: s.score, ...(top.some((t) => t.entryId === s.entryId) ? { status: 'shortlisted' as const } : {}), updatedAt: new Date() }).where(eq(schema.entries.id, s.entryId));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'instance.shortlisted', instanceId, detail: { leaderboardHash: board.hash, shortlisted: top.map((t) => t.ref), ranked: board.standings.length } });
  for (const t of top) {
    const e = entries.find((x) => x.id === t.entryId)!;
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.shortlisted', instanceId, entryId: e.id, detail: { ref: e.ref, rank: t.rank } });
    await notify(e.innovatorId, `${e.ref} is shortlisted`, `Congratulations: ranked ${t.rank} of ${board.standings.length}. The panel decides next.`, `/dashboard/entries/${e.id}`);
    await alertFollowers(e.id, e.ref, 'Shortlisted', 'It is on the shortlist. The panel decides next.');
  }
  const panel = await db.select({ id: schema.instanceRoles.userId }).from(schema.instanceRoles).where(and(eq(schema.instanceRoles.instanceId, instanceId), eq(schema.instanceRoles.role, 'panel')));
  await notifyMany(panel.map((p) => p.id), `${i.name}: shortlist ready`, `${top.length} applications are ready for your vote.`, '/dashboard/panel');
  revalidatePath('/dashboard/screening');
}

export async function castVote(entryId: string, fd: FormData) {
  const me = await requireUser({ perm: 'entry.decide' });
  const vote = String(fd.get('vote')) as 'award' | 'decline' | 'discuss';
  if (!['award', 'decline', 'discuss'].includes(vote)) return;
  const amount = vote === 'award' ? Math.max(0, Math.round(Number(fd.get('amount') ?? 0))) : null;
  const note = String(fd.get('note') ?? '').slice(0, 1000) || null;
  const { e, i } = await entryWithInstance(entryId);
  if (e.status !== 'shortlisted') return;
  await db.insert(schema.votes).values({ entryId, userId: me.id, vote, amount, note }).onConflictDoUpdate({ target: [schema.votes.entryId, schema.votes.userId], set: { vote, amount, note, createdAt: new Date() } });
  await db.update(schema.entries).set({ updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'panel.vote', instanceId: i.id, entryId, detail: { ref: e.ref, vote, amount } });
  revalidatePath(`/dashboard/panel/${entryId}`);
}

/** Finalise needs a quorum: a majority of the Instance's panel must have voted. The decision follows the majority. */
export async function finalise(entryId: string, fd: FormData) {
  const me = await requireUser({ perm: 'entry.decide' });
  const { e, i } = await entryWithInstance(entryId);
  if (e.status !== 'shortlisted') return;
  const panel = await db.select({ id: schema.instanceRoles.userId }).from(schema.instanceRoles).where(and(eq(schema.instanceRoles.instanceId, i.id), eq(schema.instanceRoles.role, 'panel')));
  const votes = await db.select().from(schema.votes).where(eq(schema.votes.entryId, entryId));
  const quorum = Math.floor(panel.length / 2) + 1;
  if (votes.length < quorum) return;
  const awards = votes.filter((v) => v.vote === 'award');
  const declines = votes.filter((v) => v.vote === 'decline');
  if (awards.length === declines.length) return;
  const note = String(fd.get('note') ?? '').trim().slice(0, 1000);
  if (awards.length > declines.length) {
    const amounts = awards.map((a) => a.amount ?? 0).sort((a, b) => a - b);
    const amount = amounts[Math.floor((amounts.length - 1) / 2)];
    const code = awardCode(e.ref, amount);
    await db.update(schema.entries).set({ status: 'awarded', awardAmount: amount, awardCode: code, decisionNote: note || 'Awarded by the adjudication panel.', decidedAt: new Date(), showcase: true, updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.awarded', instanceId: i.id, entryId, detail: { ref: e.ref, amount, code, votes: votes.map((v) => v.vote) } });
    await notify(e.innovatorId, `Awarded: ${e.ref}`, `Congratulations! The panel awarded ${pula(amount)}. Your certificate is ready.`, `/dashboard/entries/${entryId}`);
    await alertFollowers(entryId, e.ref, 'Awarded', `The panel awarded ${pula(amount)}.`);
  } else {
    await db.update(schema.entries).set({ status: 'declined', decisionNote: note || 'Not funded this round.', decidedAt: new Date(), updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.declined', instanceId: i.id, entryId, detail: { ref: e.ref, votes: votes.map((v) => v.vote) } });
    await notify(e.innovatorId, `Decision on ${e.ref}`, 'Not funded this round. Read the evaluator feedback in your application.', `/dashboard/entries/${entryId}`);
    await alertFollowers(entryId, e.ref, 'Decision made', 'A decision has been made.');
  }
  revalidatePath('/dashboard/panel');
  redirect('/dashboard/panel?decided=1');
}

export async function nudgeOverdue() {
  const me = await requireUser({ perm: 'entry.screen' });
  const late = await db.select({ id: schema.evaluations.evaluatorId }).from(schema.evaluations).where(and(isNull(schema.evaluations.submittedAt), sql`due_at < now()`, sql`coalesce(conflict, false) = false`));
  await notifyMany(late.map((l) => l.id), 'Scores overdue', 'You have applications past their scoring date. Please score them or tell us if you need more time.', '/dashboard/review');
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'evaluation.reminders_sent', detail: { evaluators: new Set(late.map((l) => l.id)).size } });
  revalidatePath('/dashboard/screening');
}

