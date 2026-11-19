'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { InstanceDefinition, Role } from '@/db/schema';
import { ROLES } from '@/db/schema';
import { appendAudit } from '@/lib/audit';
import { describeChanges, rulesHash, validateDefinition } from '@/lib/instances';
import { requireUser } from '@/lib/session';
import { standardDefinition, HACKATHON_RUBRIC } from '@/lib/catalogue';
import { PRESETS, FONTS, type Theme } from '@/lib/settings';
import { hashPassword } from '@/lib/password';
import { sha256, token } from '@/lib/crypto';
import { notify, send } from '@/lib/notify';

export type AState = { error?: string; ok?: string; errors?: string[] } | undefined;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// ── Instance Studio ────────────────────────────────────────────────────────
const TEMPLATES: Record<string, () => InstanceDefinition> = {
  call: () => standardDefinition(),
  ideas: () => standardDefinition({ kind: 'ideas', reviewersPerEntry: 2 }),
  hackathon: () => standardDefinition({ kind: 'hackathon', rubric: HACKATHON_RUBRIC, shortlistSize: 5, team: { min: 1, max: 5 } }),
  accelerator: () => standardDefinition({ kind: 'accelerator' }),
  staff: () => standardDefinition({ kind: 'ideas', audience: 'staff', eligibility: {}, reviewersPerEntry: 2, shortlistSize: 3 }),
};

export async function createInstance(_: AState, fd: FormData): Promise<AState> {
  const me = await requireUser({ perm: 'instance.manage' });
  const name = String(fd.get('name') ?? '').trim();
  const template = String(fd.get('template') ?? 'call');
  if (name.length < 5) return { error: 'Give it a name of at least 5 characters.' };
  const spaceId = me.role === 'partner_admin' ? me.spaceId! : String(fd.get('spaceId'));
  const def = (TEMPLATES[template] ?? TEMPLATES.call)();
  let slug = slugify(name);
  const [clash] = await db.select({ id: schema.instances.id }).from(schema.instances).where(eq(schema.instances.slug, slug));
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const [i] = await db.insert(schema.instances).values({ spaceId, slug, name, tagline: String(fd.get('tagline') ?? ''), description: String(fd.get('tagline') ?? ''), definition: def, rulesHash: rulesHash(def), status: 'draft', photo: '/photos/lab-drone.webp', createdById: me.id, opensAt: new Date(def.stages[0].starts), closesAt: new Date(def.stages.at(-1)!.ends) }).returning();
  await db.insert(schema.instanceRoles).values({ userId: me.id, instanceId: i.id, role: 'organiser' });
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'instance.created', instanceId: i.id, detail: { name, template } });
  redirect(`/dashboard/instances/${i.id}`);
}

async function loadManaged(id: string) {
  const me = await requireUser({ perm: 'instance.manage' });
  const [i] = await db.select().from(schema.instances).where(eq(schema.instances.id, id)).limit(1);
  if (!i) throw new Error('Not found');
  if (me.role === 'partner_admin' && i.spaceId !== me.spaceId) throw new Error('Not your space');
  return { me, i };
}

/** Save rules. Drafts change freely; a live Instance needs a reason, and gets a new sealed version with a public change list. */
export async function saveDefinition(id: string, json: string, reason: string, meta: { name: string; tagline: string; description: string; photo: string }): Promise<AState> {
  const { me, i } = await loadManaged(id);
  let def: InstanceDefinition;
  try { def = JSON.parse(json); } catch { return { error: 'Could not read the rules.' }; }
  const errors = validateDefinition(def);
  if (errors.length) return { error: 'Fix these first:', errors };
  const changes = describeChanges(i.definition, def);
  const metaChanged = meta.name !== i.name || meta.tagline !== i.tagline || meta.description !== i.description || meta.photo !== (i.photo ?? '');
  if (!changes.length && !metaChanged) return { ok: 'No changes to save.' };
  const hash = rulesHash(def);
  if (i.status === 'draft') {
    await db.update(schema.instances).set({ definition: def, rulesHash: hash, name: meta.name, tagline: meta.tagline, description: meta.description, photo: meta.photo || null, opensAt: new Date(def.stages[0].starts), closesAt: new Date(def.stages.at(-1)!.ends), updatedAt: new Date() }).where(eq(schema.instances.id, id));
    revalidatePath(`/dashboard/instances/${id}`);
    return { ok: 'Draft saved.' };
  }
  if (changes.length && reason.trim().length < 10) return { error: 'This Instance is live. Explain the change (at least 10 characters); applicants will see your reason.' };
  const version = i.version + (changes.length ? 1 : 0);
  await db.update(schema.instances).set({ definition: def, rulesHash: hash, version, name: meta.name, tagline: meta.tagline, description: meta.description, photo: meta.photo || null, opensAt: new Date(def.stages[0].starts), closesAt: new Date(def.stages.at(-1)!.ends), updatedAt: new Date() }).where(eq(schema.instances.id, id));
  if (changes.length) {
    await db.insert(schema.instanceVersions).values({ instanceId: id, version, reason: reason.trim(), definition: def, rulesHash: hash, changes, byId: me.id });
    await appendAudit({ actorId: me.id, actorName: me.name, action: 'instance.rules_changed', instanceId: id, detail: { version, from: i.rulesHash, to: hash, reason: reason.trim(), changes } });
    const affected = await db.select({ id: schema.entries.innovatorId }).from(schema.entries).where(and(eq(schema.entries.instanceId, id), sql`status in ('draft','submitted','screening','in_review','returned')`));
    for (const a of new Set(affected.map((x) => x.id))) await notify(a, `Rules updated: ${i.name}`, `Version ${version}: ${reason.trim()}`, `/i/${i.slug}`);
  }
  revalidatePath(`/dashboard/instances/${id}`); revalidatePath(`/i/${i.slug}`);
  return { ok: changes.length ? `Published version ${version}. ${changes.length} change(s) recorded and applicants told.` : 'Saved.' };
}

export async function setInstanceStatus(id: string, status: 'live' | 'closed' | 'archived' | 'draft') {
  const { me, i } = await loadManaged(id);
  if (status === 'live') { const errs = validateDefinition(i.definition); if (errs.length) return; }
  await db.update(schema.instances).set({ status, updatedAt: new Date() }).where(eq(schema.instances.id, id));
  if (status === 'live' && i.status === 'draft') {
    await db.insert(schema.instanceVersions).values({ instanceId: id, version: i.version, reason: 'First published', definition: i.definition, rulesHash: i.rulesHash, byId: me.id }).onConflictDoNothing();
    const evals = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, 'evaluator'));
    const panel = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, 'panel'));
    await db.insert(schema.instanceRoles).values([...evals.map((u) => ({ userId: u.id, instanceId: id, role: 'evaluator' as const })), ...panel.map((u) => ({ userId: u.id, instanceId: id, role: 'panel' as const }))]).onConflictDoNothing();
  }
  await appendAudit({ actorId: me.id, actorName: me.name, action: status === 'live' ? 'instance.published' : `instance.${status}`, instanceId: id, detail: { rulesHash: i.rulesHash, version: i.version } });
  revalidatePath(`/dashboard/instances/${id}`); revalidatePath('/instances');
}

// ── Content ────────────────────────────────────────────────────────────────
export async function saveContent(_: AState, fd: FormData): Promise<AState> {
  const me = await requireUser({ perm: 'content.manage' });
  const id = String(fd.get('id') ?? '');
  const kind = String(fd.get('kind')) as 'page' | 'faq' | 'notice' | 'document';
  const title = String(fd.get('title') ?? '').trim();
  if (!title) return { error: 'Add a title.' };
  const values = { kind, title: title.slice(0, 200), body: String(fd.get('body') ?? '').slice(0, 20000), category: String(fd.get('category') ?? '') || null, slug: kind === 'page' ? slugify(String(fd.get('slug') || title)) : null, url: String(fd.get('url') ?? '') || null, published: fd.get('published') === 'on', sort: Number(fd.get('sort') ?? 0) || 0, updatedById: me.id, updatedAt: new Date() };
  if (id) await db.update(schema.content).set(values).where(eq(schema.content.id, id));
  else await db.insert(schema.content).values(values);
  await appendAudit({ actorId: me.id, actorName: me.name, action: id ? 'content.updated' : 'content.created', detail: { kind, title } });
  revalidatePath('/help'); revalidatePath('/dashboard/content');
  return { ok: id ? 'Saved.' : 'Added.' };
}

export async function deleteContent(id: string) {
  const me = await requireUser({ perm: 'content.manage' });
  const [c] = await db.select().from(schema.content).where(eq(schema.content.id, id));
  if (!c) return;
  await db.delete(schema.content).where(eq(schema.content.id, id));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'content.deleted', detail: { kind: c.kind, title: c.title } });
  revalidatePath('/dashboard/content'); revalidatePath('/help');
}

// ── Users and roles ────────────────────────────────────────────────────────
export async function setRole(userId: string, fd: FormData) {
  const me = await requireUser({ perm: 'users.manage' });
  const role = String(fd.get('role')) as Role;
  if (!ROLES.includes(role)) return;
  if (role === 'superadmin' && me.role !== 'superadmin') return;
  if (userId === me.id) return;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u || (u.role === 'superadmin' && me.role !== 'superadmin')) return;
  await db.update(schema.users).set({ role, spaceId: role === 'partner_admin' ? String(fd.get('spaceId') || u.spaceId || '') || null : u.spaceId }).where(eq(schema.users.id, userId));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'user.role_changed', detail: { user: u.email, from: u.role, to: role } });
  revalidatePath('/dashboard/users');
}

export async function inviteUser(_: AState, fd: FormData): Promise<AState> {
  const me = await requireUser({ perm: 'users.manage' });
  const email = String(fd.get('email') ?? '').trim().toLowerCase(); const name = String(fd.get('name') ?? '').trim();
  const role = String(fd.get('role')) as Role;
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a name and a valid email.' };
  if (!ROLES.includes(role) || (role === 'superadmin' && me.role !== 'superadmin')) return { error: 'You cannot give that role.' };
  const [x] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (x) return { error: 'That email already has an account.' };
  const temp = token(9);
  await db.insert(schema.users).values({ name, email, role, passwordHash: await hashPassword(temp), title: String(fd.get('title') ?? '') || null, emailVerifiedAt: new Date() });
  await send('email', email, 'You have been invited to the CEDA Innovation Portal', `Hello ${name}, you have been added as ${role}. Sign in with a one-time code sent to this email, then set a password in your profile.`);
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'user.invited', detail: { email, role } });
  revalidatePath('/dashboard/users');
  return { ok: `Invited ${name}. They sign in with a one-time code sent to ${email}.` };
}

export async function unlockUser(userId: string) {
  const me = await requireUser({ perm: 'users.manage' });
  await db.update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, userId));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'user.unlocked', detail: { userId } });
  revalidatePath('/dashboard/users');
}

// ── Look and settings ──────────────────────────────────────────────────────
export async function saveTheme(_: AState, fd: FormData): Promise<AState> {
  const me = await requireUser({ perm: 'settings.manage' });
  const preset = String(fd.get('preset') ?? '');
  const base: Theme = PRESETS[preset] ?? PRESETS.ceda;
  const hex = (v: FormDataEntryValue | null, f: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : f);
  const font = String(fd.get('font') ?? base.font);
  const t: Theme = { preset: fd.get('custom') === 'on' ? 'custom' : base.preset, primary: hex(fd.get('primary'), base.primary), accent: hex(fd.get('accent'), base.accent), font: FONTS.includes(font) ? font : base.font, radius: Math.max(0, Math.min(28, Number(fd.get('radius') ?? base.radius))) };
  if (fd.get('custom') !== 'on') Object.assign(t, base);
  await db.insert(schema.settings).values({ key: 'theme', value: t }).onConflictDoUpdate({ target: schema.settings.key, set: { value: t, updatedAt: new Date() } });
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'settings.theme_changed', detail: t });
  revalidatePath('/', 'layout');
  return { ok: 'Saved. The new look is live for everyone.' };
}

export async function createApiKey(_: AState, fd: FormData): Promise<AState> {
  const me = await requireUser({ perm: 'settings.manage' });
  const name = String(fd.get('name') ?? '').trim() || 'Integration';
  const raw = `ceda_live_${token(24)}`;
  await db.insert(schema.apiKeys).values({ name, prefix: raw.slice(0, 14), keyHash: sha256(raw), createdById: me.id, spaceId: String(fd.get('spaceId') || '') || null });
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'settings.api_key_created', detail: { name, prefix: raw.slice(0, 14) } });
  revalidatePath('/dashboard/settings');
  return { ok: `Copy this key now; it will not be shown again: ${raw}` };
}

export async function revokeApiKey(id: string) {
  const me = await requireUser({ perm: 'settings.manage' });
  await db.update(schema.apiKeys).set({ revokedAt: new Date() }).where(and(eq(schema.apiKeys.id, id), isNull(schema.apiKeys.revokedAt)));
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'settings.api_key_revoked', detail: { id } });
  revalidatePath('/dashboard/settings');
}
