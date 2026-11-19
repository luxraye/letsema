'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { InstanceDefinition, TeamMember } from '@/db/schema';
import { appendAudit } from '@/lib/audit';
import { canonical, sha256 } from '@/lib/crypto';
import { checkFile } from '@/lib/files';
import { ageFrom, checkEligibility } from '@/lib/eligibility';
import { acceptingEntries } from '@/lib/instances';
import { alertFollowers, notify } from '@/lib/notify';
import { requireUser, currentUser } from '@/lib/session';
import { can } from '@/lib/rbac';

async function loadOwn(entryId: string) {
  const me = await requireUser({ perm: 'entry.create' });
  const [row] = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(and(eq(schema.entries.id, entryId), eq(schema.entries.innovatorId, me.id))).limit(1);
  if (!row) throw new Error('Application not found');
  return { me, ...row };
}

async function nextRef() {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.entries);
  return `CEDA-26-${String(101 + r.n).padStart(4, '0')}`;
}

export async function startEntry(slug: string) {
  const me = await currentUser();
  if (!me) redirect(`/login?next=${encodeURIComponent(`/i/${slug}`)}`);
  if (!can(me.role, 'entry.create')) redirect('/dashboard?denied=1');
  const [inst] = await db.select().from(schema.instances).where(eq(schema.instances.slug, slug)).limit(1);
  if (!inst) redirect('/instances');
  if (inst.definition.audience === 'staff' && !me.email.endsWith('@ceda.co.bw') && me.organisation !== 'CEDA') redirect(`/i/${slug}?staffOnly=1`);
  const [existing] = await db.select({ id: schema.entries.id }).from(schema.entries).where(and(eq(schema.entries.instanceId, inst.id), eq(schema.entries.innovatorId, me.id), sql`status not in ('withdrawn','declined')`)).limit(1);
  if (existing) redirect(`/dashboard/entries/${existing.id}`);
  if (!acceptingEntries(inst.definition, inst.status)) redirect(`/i/${slug}?closed=1`);
  let ref = await nextRef();
  for (let i = 0; i < 5; i++) { const [c] = await db.select({ id: schema.entries.id }).from(schema.entries).where(eq(schema.entries.ref, ref)); if (!c) break; ref = `CEDA-26-${String(Number(ref.slice(-4)) + 1).padStart(4, '0')}`; }
  const [e] = await db.insert(schema.entries).values({ ref, instanceId: inst.id, innovatorId: me.id, title: 'Untitled application', district: me.district, team: [{ name: me.name, email: me.email, lead: true, share: 100, role: 'Team lead' }] }).returning();
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.started', instanceId: inst.id, entryId: e.id, detail: { ref } });
  redirect(`/dashboard/entries/${e.id}/edit`);
}

/** Autosave. Called every few seconds from the form; only drafts and returned entries can change. */
export async function saveDraft(entryId: string, data: { title: string; summary: string; sector: string; answers: Record<string, string>; team: TeamMember[] }) {
  const { e } = await loadOwn(entryId);
  if (!['draft', 'returned'].includes(e.status)) return { error: 'This application is locked while it is being judged.' };
  const answers = Object.fromEntries(Object.entries(data.answers ?? {}).map(([k, v]) => [k.slice(0, 60), String(v).slice(0, 8000)]));
  const team = (data.team ?? []).slice(0, 8).map((m) => ({ name: String(m.name ?? '').slice(0, 80), email: String(m.email ?? '').slice(0, 120), omang: m.omang ? String(m.omang).slice(0, 12) : undefined, role: m.role ? String(m.role).slice(0, 60) : undefined, share: m.share != null ? Number(m.share) : undefined, lead: !!m.lead }));
  await db.update(schema.entries).set({ title: String(data.title ?? '').slice(0, 140) || 'Untitled application', summary: String(data.summary ?? '').slice(0, 400), sector: data.sector || null, answers, team, updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
  return { ok: true, at: new Date().toISOString() };
}

export async function uploadFile(entryId: string, field: string, fd: FormData) {
  const { e, i } = await loadOwn(entryId);
  if (!['draft', 'returned'].includes(e.status)) return { error: 'This application is locked.' };
  const rule = i.definition.form.find((f) => f.key === field && f.type === 'file');
  if (!rule) return { error: 'Unknown upload.' };
  const file = fd.get('file');
  if (!(file instanceof File) || !file.size) return { error: 'Choose a file.' };
  if (file.size > 12 * 1048576) return { error: 'Files must be under 12 MB.' };
  const buf = Buffer.from(await file.arrayBuffer());
  const check = checkFile(file.name, buf, rule);
  if (check.status === 'fail') return { error: check.detail };
  await db.delete(schema.entryFiles).where(and(eq(schema.entryFiles.entryId, entryId), eq(schema.entryFiles.field, field)));
  const sha = sha256(buf);
  await db.insert(schema.entryFiles).values({ entryId, field, name: file.name.slice(0, 120), mime: file.type || 'application/octet-stream', detected: check.detected, size: buf.length, sha256: sha, pages: check.pages, content: buf });
  await db.update(schema.entries).set({ updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
  revalidatePath(`/dashboard/entries/${entryId}/edit`);
  return { ok: check.status === 'warn' ? `Uploaded, but: ${check.detail}` : `Uploaded and checked: ${check.detail}.`, sha: sha.slice(0, 12) };
}

function words(s: string) { return s.trim() ? s.trim().split(/\s+/).length : 0; }

/** Submit: run every check, seal the answers with a fingerprint, and hand over to CEDA. */
export async function submitEntry(entryId: string) {
  const { me, e, i } = await loadOwn(entryId);
  const def = i.definition;
  if (!['draft', 'returned'].includes(e.status)) return { error: 'Already submitted.' };
  if (e.status === 'draft' && !acceptingEntries(def, i.status)) return { error: 'This competition is not accepting entries right now.' };
  const files = await db.select({ field: schema.entryFiles.field, sha256: schema.entryFiles.sha256, name: schema.entryFiles.name }).from(schema.entryFiles).where(eq(schema.entryFiles.entryId, entryId));
  const problems: string[] = [];
  if (!e.title || e.title === 'Untitled application') problems.push('Give your application a title.');
  for (const f of def.form) {
    const v = e.answers[f.key] ?? '';
    if (f.type === 'file') { if (f.required && !files.some((x) => x.field === f.key)) problems.push(`Upload: ${f.label}`); continue; }
    if (f.required && !v.trim()) problems.push(`Answer: ${f.label}`);
    if (f.maxWords && words(v) > f.maxWords) problems.push(`“${f.label}” is ${words(v)} words; the limit is ${f.maxWords}.`);
    if (f.type === 'number' && v && Number.isNaN(Number(v))) problems.push(`“${f.label}” must be a number.`);
    if (f.type === 'url' && v && !/^https?:\/\/\S+\.\S+/.test(v)) problems.push(`“${f.label}” must be a web link starting with https://`);
  }
  if (e.team.length < def.team.min || e.team.length > def.team.max) problems.push(`Teams must have ${def.team.min} to ${def.team.max} members.`);
  if (problems.length) return { error: 'Please fix these first:', problems };

  const elig = checkEligibility(def, { age: ageFrom(me.dateOfBirth), citizen: !!me.omang, youthShare: me.youthShare ?? undefined, cipa: !!me.cipaNumber, staff: me.organisation === 'CEDA' });
  const checks = [
    { key: 'complete', label: 'All required answers given', status: 'pass' as const, detail: 'Every required question answered and within word limits.' },
    { key: 'files', label: 'Uploaded files', status: 'pass' as const, detail: files.length ? files.map((f) => `${f.name} (${f.sha256.slice(0, 8)}…)`).join(', ') : 'No files needed.' },
    { key: 'eligibility', label: 'Eligibility', status: elig.ok ? 'pass' as const : 'warn' as const, detail: elig.ok ? 'Profile meets the published rules.' : `To confirm at screening: ${elig.reasons.filter((r) => !r.ok).map((r) => r.text).join('; ')}. Complete your profile to speed this up.` },
  ];
  const version = e.version + 1;
  const seal = sha256(canonical({ ref: e.ref, version, title: e.title, answers: e.answers, team: e.team, files: files.map((f) => [f.field, f.sha256]), rules: i.rulesHash }));
  await db.transaction(async (tx) => {
    await tx.update(schema.entries).set({ status: 'submitted', version, sealHash: seal, rulesHashAtSubmit: i.rulesHash, submittedAt: new Date(), updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
    await tx.insert(schema.entryVersions).values({ entryId, version, title: e.title, answers: e.answers, sealHash: seal });
    await tx.delete(schema.checks).where(eq(schema.checks.entryId, entryId));
    await tx.insert(schema.checks).values(checks.map((c) => ({ ...c, entryId })));
    if (e.status === 'returned') await tx.insert(schema.messages).values({ entryId, authorId: me.id, kind: 'system', body: `Resubmitted as version ${version}.` });
    await appendAudit({ actorId: me.id, actorName: me.name, action: e.status === 'returned' ? 'entry.resubmitted' : 'entry.submitted', instanceId: i.id, entryId, detail: { ref: e.ref, version, seal, rulesHash: i.rulesHash } }, tx);
  });
  await notify(me.id, `Received: ${e.ref}`, `Your application “${e.title}” was submitted and sealed. Keep your reference ${e.ref} to track it.`, `/dashboard/entries/${entryId}`);
  await alertFollowers(entryId, e.ref, 'Submitted', 'The application was submitted and is waiting for screening.');
  revalidatePath('/dashboard');
  return { ok: true, ref: e.ref, seal };
}

export async function withdrawEntry(entryId: string) {
  const { me, e } = await loadOwn(entryId);
  if (['awarded', 'declined', 'withdrawn'].includes(e.status)) return;
  await db.update(schema.entries).set({ status: 'withdrawn', updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'entry.withdrawn', instanceId: e.instanceId, entryId, detail: { ref: e.ref } });
  revalidatePath(`/dashboard/entries/${entryId}`);
}

/** Feedback thread. Innovators post to their own entries; staff with access can post (optionally internal). */
export async function postMessage(entryId: string, fd: FormData) {
  const me = await requireUser();
  const body = String(fd.get('body') ?? '').trim().slice(0, 3000);
  if (!body) return;
  const [e] = await db.select().from(schema.entries).where(eq(schema.entries.id, entryId)).limit(1);
  if (!e) return;
  const own = e.innovatorId === me.id;
  if (!own && !can(me.role, 'entry.screen') && !can(me.role, 'entry.decide')) return;
  const internal = !own && fd.get('internal') === 'on';
  await db.insert(schema.messages).values({ entryId, authorId: me.id, body, internal });
  await db.update(schema.entries).set({ updatedAt: new Date() }).where(eq(schema.entries.id, entryId));
  if (!own && !internal) await notify(e.innovatorId, `New message on ${e.ref}`, body.slice(0, 160), `/dashboard/entries/${entryId}`);
  if (own) {
    const staff = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, 'admin'));
    for (const s of staff) await notify(s.id, `Innovator replied on ${e.ref}`, body.slice(0, 160), `/dashboard/screening/${entryId}`);
  }
  revalidatePath(`/dashboard/entries/${entryId}`);
}

export async function cheer(entryId: string) {
  await db.update(schema.entries).set({ cheers: sql`${schema.entries.cheers} + 1` }).where(eq(schema.entries.id, entryId));
  revalidatePath('/funded');
}

