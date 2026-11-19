// Every change in the portal goes through one of these functions.
// Each one: checks permission, validates input, applies the change,
// writes a hash-chained audit entry, and sends the notifications it causes.
import { assertCan, can } from './rbac';
import { hashPassword } from './seed';
import { sha256 } from './sha256';
import { appendAudit, store } from './store';
import type {
  Campaign, Conversation, Faq, Idea, Milestone, Notice, Page, Permission, RoleDef, State, Status, User, DocumentFile, Theme, AlertPrefs,
} from './types';
import { DAY, now, uid } from './util';
import { STATUS_META, TRANSITIONS } from './workflow';

export class ActionError extends Error {}

const S = () => store.state;
const userById = (id: string) => S().users.find((u) => u.id === id);
const ideaById = (id: string) => {
  const i = S().ideas.find((x) => x.id === id || x.ref === id);
  if (!i) throw new ActionError('Idea not found.');
  return i;
};
const campaignOf = (idea: Idea) => S().campaigns.find((c) => c.id === idea.campaignId)!;

// ---------------------------------------------------------------- notifications

function notify(state: State, userId: string, title: string, body: string, link?: string) {
  const u = state.users.find((x) => x.id === userId);
  if (!u) return;
  if (u.alerts.inapp) state.notifications.unshift({ id: uid('n'), userId, at: now(), title, body, link, read: false });
  if (u.alerts.email) state.outbox.unshift({ id: uid('mail'), to: u.email, channel: 'email', subject: `[Letsema] ${title}`, body, at: now() });
  if (u.alerts.sms && u.phone) state.outbox.unshift({ id: uid('sms'), to: u.phone, channel: 'sms', subject: title, body: `${title}. ${body}`.slice(0, 160), at: now() });
}

function notifyStatus(state: State, idea: Idea, extra?: string) {
  const meta = STATUS_META[idea.status];
  const body = `${idea.ref} “${idea.title}” is now: ${meta.label}. ${extra ?? meta.next}`;
  notify(state, idea.ownerId, `Update on ${idea.ref}`, body, `/app/ideas/${idea.id}`);
  for (const w of idea.watchers) {
    state.outbox.unshift({ id: uid('alert'), to: w.contact, channel: w.channel, subject: `[Letsema] ${idea.ref} is now ${meta.label}`, body: `${body} Track it: /track/${idea.ref}`.slice(0, w.channel === 'sms' ? 160 : 2000), at: now() });
  }
}

function setStatus(state: State, idea: Idea, actor: User, to: Status, note?: string) {
  if (!TRANSITIONS[idea.status].includes(to)) throw new ActionError(`Cannot move from ${STATUS_META[idea.status].label} to ${STATUS_META[to].label}.`);
  idea.status = to;
  idea.updatedAt = now();
  idea.history.push({ at: now(), status: to, by: actor.id, note });
  appendAudit(state, actor, `idea.${to}`, idea.ref, note ?? '');
  notifyStatus(state, idea, note);
}

// ---------------------------------------------------------------- auth

export const PASSWORD_RULES = 'At least 10 characters, with a letter and a number.';
export function passwordOk(pw: string) {
  return pw.length >= 10 && /[a-z]/i.test(pw) && /\d/.test(pw);
}

const attempts = new Map<string, { n: number; until: number }>();

function issueOtp(state: State, to: string, purpose: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  state.otps = state.otps.filter((o) => !(o.to === to && o.purpose === purpose));
  state.otps.push({ to, code: sha256(code), purpose, expires: new Date(Date.now() + 10 * 60_000).toISOString() });
  const isPhone = to.startsWith('+') || /^\d/.test(to);
  state.outbox.unshift({
    id: uid('otp'), to, channel: isPhone ? 'sms' : 'email',
    subject: purpose === 'verify' ? 'Verify your Letsema account' : purpose === 'reset' ? 'Reset your Letsema password' : 'Your Letsema sign-in code',
    body: `Your one-time code is ${code}. It expires in 10 minutes. Never share it; CEDA staff will never ask for it.`, at: now(),
  });
  return code;
}

function consumeOtp(state: State, to: string, purpose: string, code: string) {
  const o = state.otps.find((x) => x.to === to && x.purpose === purpose);
  if (!o || new Date(o.expires).getTime() < Date.now() || o.code !== sha256(code.trim())) throw new ActionError('That code is wrong or has expired. Request a new one.');
  state.otps = state.otps.filter((x) => x !== o);
}

const findByContact = (contact: string) => {
  const c = contact.trim().toLowerCase().replace(/\s+/g, '');
  return S().users.find((u) => u.email.toLowerCase() === c || (u.phone && u.phone.replace(/\s+/g, '') === c));
};

export function register(input: { name: string; email: string; phone?: string; password: string; consent: boolean; staff?: boolean }) {
  const email = input.email.trim().toLowerCase();
  if (input.name.trim().length < 3) throw new ActionError('Please enter your full name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ActionError('Please enter a valid email address.');
  if (input.phone && !/^\+?267\s?7\d[\d\s]{6,8}$/.test(input.phone.trim())) throw new ActionError('Phone numbers should look like +267 71 234 567.');
  if (!passwordOk(input.password)) throw new ActionError(PASSWORD_RULES);
  if (!input.consent) throw new ActionError('Please agree to the privacy notice to create an account.');
  if (findByContact(email)) throw new ActionError('An account with this email already exists. Try signing in or resetting your password.');
  const user: User = {
    id: uid('u'), name: input.name.trim(), email, phone: input.phone?.trim() || undefined, role: 'innovator', verified: false,
    passwordHash: hashPassword(email, input.password), passkeys: [], createdAt: now(), consentAt: now(),
    alerts: { inapp: true, email: true, sms: !!input.phone }, staff: input.staff,
  };
  store.commit('user.registered', (s) => {
    s.users.push(user);
    issueOtp(s, input.phone?.trim() ? input.phone.trim() : email, 'verify');
    appendAudit(s, user, 'user.registered', user.id, 'Self-registration; awaiting verification');
  });
  return user;
}

export function verifyAccount(userId: string, code: string) {
  const u = userById(userId);
  if (!u) throw new ActionError('Account not found.');
  const to = u.phone ?? u.email;
  store.commit('user.verified', (s) => {
    try { consumeOtp(s, to, 'verify', code); } catch (e) { consumeOtp(s, u.email, 'verify', code); void e; }
    u.verified = true;
    appendAudit(s, u, 'user.verified', u.id, `Contact verified (${u.phone ? 'SMS' : 'email'})`);
  });
  store.setSession(u.id);
}

export function resendVerification(userId: string) {
  const u = userById(userId);
  if (!u) return;
  store.commit('otp.sent', (s) => { issueOtp(s, u.phone ?? u.email, 'verify'); });
}

export function login(contact: string, password: string): User {
  const key = contact.trim().toLowerCase();
  const a = attempts.get(key);
  if (a && a.until > Date.now()) throw new ActionError('Too many attempts. Please wait a minute and try again, or reset your password.');
  const u = findByContact(contact);
  if (!u || u.disabled || u.passwordHash !== hashPassword(u.email, password)) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(key, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    store.commit('auth.failed', (s) => appendAudit(s, null, 'auth.failed', key.replace(/(.{2}).*(@.*)/, '$1***$2'), `Failed sign-in (${n})`));
    throw new ActionError('Email/phone or password is incorrect.');
  }
  attempts.delete(key);
  if (!u.verified) {
    resendVerification(u.id);
    throw new ActionError(`UNVERIFIED:${u.id}`);
  }
  store.commit('auth.login', (s) => appendAudit(s, u, 'auth.login', u.id, 'Password sign-in'));
  store.setSession(u.id);
  return u;
}

/** One-click demo sign-in (labelled as such in the UI). */
export function demoLogin(userId: string) {
  const u = userById(userId);
  if (!u) return;
  store.commit('auth.login', (s) => appendAudit(s, u, 'auth.login', u.id, 'Demo one-click sign-in'));
  store.setSession(u.id);
}

export function requestOtpLogin(contact: string) {
  const u = findByContact(contact);
  // Same response whether or not the account exists (no account enumeration).
  if (u) store.commit('otp.sent', (s) => { issueOtp(s, contact.trim(), 'login'); });
}

export function otpLogin(contact: string, code: string) {
  const u = findByContact(contact);
  if (!u) throw new ActionError('That code is wrong or has expired. Request a new one.');
  store.commit('auth.login', (s) => {
    consumeOtp(s, contact.trim(), 'login', code);
    if (!u.verified) u.verified = true;
    appendAudit(s, u, 'auth.login', u.id, 'One-time code sign-in');
  });
  store.setSession(u.id);
}

export function forgotPassword(contact: string) {
  const u = findByContact(contact);
  if (u) store.commit('otp.sent', (s) => { issueOtp(s, contact.trim(), 'reset'); appendAudit(s, u, 'auth.reset_requested', u.id, 'Password reset code sent'); });
}

export function resetPassword(contact: string, code: string, password: string) {
  if (!passwordOk(password)) throw new ActionError(PASSWORD_RULES);
  const u = findByContact(contact);
  if (!u) throw new ActionError('That code is wrong or has expired. Request a new one.');
  store.commit('auth.reset', (s) => {
    consumeOtp(s, contact.trim(), 'reset', code);
    u.passwordHash = hashPassword(u.email, password);
    appendAudit(s, u, 'auth.password_reset', u.id, 'Password reset with one-time code');
    notify(s, u.id, 'Your password was changed', 'If this was not you, contact CEDA immediately.');
  });
}

export function changePassword(user: User, oldPw: string, newPw: string) {
  if (user.passwordHash !== hashPassword(user.email, oldPw)) throw new ActionError('Your current password is incorrect.');
  if (!passwordOk(newPw)) throw new ActionError(PASSWORD_RULES);
  store.commit('auth.password_changed', (s) => {
    const u = s.users.find((x) => x.id === user.id)!;
    u.passwordHash = hashPassword(u.email, newPw);
    appendAudit(s, u, 'auth.password_changed', u.id, 'Password changed');
    notify(s, u.id, 'Your password was changed', 'If this was not you, reset it now.');
  });
}

export function addPasskey(user: User, credentialId: string, label: string) {
  store.commit('auth.passkey_added', (s) => {
    const u = s.users.find((x) => x.id === user.id)!;
    u.passkeys.push({ id: credentialId, label, createdAt: now() });
    appendAudit(s, u, 'auth.passkey_added', u.id, label);
  });
}

export function passkeyLogin(credentialId: string) {
  const u = S().users.find((x) => x.passkeys.some((p) => p.id === credentialId));
  if (!u) throw new ActionError('This passkey is not registered on Letsema.');
  store.commit('auth.login', (s) => appendAudit(s, u, 'auth.login', u.id, 'Passkey (biometric) sign-in'));
  store.setSession(u.id);
}

export function logout() {
  const me = store.me;
  if (me) store.commit('auth.logout', (s) => appendAudit(s, me, 'auth.logout', me.id, ''));
  store.setSession(null);
}

export function updateProfile(user: User, patch: Partial<Pick<User, 'name' | 'phone' | 'org' | 'district'>>) {
  store.commit('user.updated', (s) => {
    const u = s.users.find((x) => x.id === user.id)!;
    Object.assign(u, patch);
    appendAudit(s, u, 'user.updated', u.id, Object.keys(patch).join(', '));
  });
}

export function setAlertPrefs(user: User, prefs: AlertPrefs) {
  store.commit('alerts.updated', (s) => {
    const u = s.users.find((x) => x.id === user.id)!;
    u.alerts = prefs;
    appendAudit(s, u, 'alerts.updated', u.id, Object.entries(prefs).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none');
  });
}

// ---------------------------------------------------------------- ideas

export interface Missing { field: string; label: string }

export function validateIdea(c: Campaign, idea: Pick<Idea, 'title' | 'summary' | 'answers' | 'attachments'>): Missing[] {
  const m: Missing[] = [];
  if (idea.title.trim().length < 5) m.push({ field: 'title', label: 'Idea title (at least 5 characters)' });
  if (idea.summary.trim().length < 30) m.push({ field: 'summary', label: 'One-paragraph summary (at least 30 characters)' });
  for (const f of c.form) {
    const v = (idea.answers[f.id] ?? '').trim();
    if (f.required && (!v || (f.type === 'checkbox' && v !== 'yes'))) m.push({ field: f.id, label: f.label });
    else if (v && f.type === 'number' && (isNaN(Number(v)) || (f.min != null && Number(v) < f.min) || (f.max != null && Number(v) > f.max))) m.push({ field: f.id, label: `${f.label} (must be a number between ${f.min ?? 0} and ${f.max ?? '∞'})` });
    else if (v && f.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(v)) m.push({ field: f.id, label: `${f.label} (must start with https://)` });
    else if (v && f.maxLength && v.length > f.maxLength) m.push({ field: f.id, label: `${f.label} (too long)` });
  }
  for (const d of c.documents) if (d.required && !idea.attachments.some((a) => a.docId === d.id)) m.push({ field: `doc:${d.id}`, label: `Document: ${d.name}` });
  return m;
}

export function saveDraft(user: User, input: { id?: string; campaignId: string; title: string; summary: string; sector: string; district: string; team: string[]; answers: Record<string, string>; attachments: Idea['attachments'] }): Idea {
  assertCan(S(), user, 'idea.create');
  const c = S().campaigns.find((x) => x.id === input.campaignId);
  if (!c || c.status !== 'open') throw new ActionError('This call is not open for submissions.');
  if (c.track === 'staff' && !user.staff) throw new ActionError('This campaign is for CEDA staff only.');
  let idea: Idea | undefined = input.id ? S().ideas.find((i) => i.id === input.id) : undefined;
  if (idea && idea.ownerId !== user.id) throw new ActionError('You can only edit your own ideas.');
  if (idea && !['draft', 'revision'].includes(idea.status)) throw new ActionError('This idea is locked while it is being evaluated.');
  store.commit('idea.saved', (s) => {
    if (!idea) {
      const n = s.ideas.length + 101;
      idea = {
        id: uid('i'), ref: `LTS-26-${String(n).padStart(4, '0')}`, campaignId: c.id, ownerId: user.id, team: [], title: '', summary: '', sector: '', district: '',
        answers: {}, attachments: [], status: 'draft', round: 1, versions: [], assignments: [], reviews: [], thread: [], milestones: [], history: [{ at: now(), status: 'draft', by: user.id, note: 'Draft started' }],
        watchers: [], showcase: false, cheers: 0, createdAt: now(), updatedAt: now(),
      };
      s.ideas.push(idea);
      appendAudit(s, user, 'idea.draft_created', idea.ref, c.title);
    }
    Object.assign(idea, { title: input.title, summary: input.summary, sector: input.sector, district: input.district, team: input.team, answers: input.answers, attachments: input.attachments, updatedAt: now() });
  });
  return idea!;
}

export function submitIdea(user: User, ideaId: string) {
  const idea = ideaById(ideaId);
  if (idea.ownerId !== user.id) throw new ActionError('You can only submit your own ideas.');
  const c = campaignOf(idea);
  const missing = validateIdea(c, idea);
  if (missing.length) throw new ActionError(`Please complete: ${missing.map((m) => m.label).join('; ')}`);
  store.commit('idea.submitted', (s) => {
    idea.versions.push({ n: idea.versions.length + 1, at: now(), title: idea.title, summary: idea.summary, answers: { ...idea.answers }, note: 'First submission' });
    setStatus(s, idea, user, 'submitted', 'Submitted with signed receipt');
    if (!c.levels.screening) {
      autoAssign(s, idea, c);
      setStatus(s, idea, user, 'in_review', `Assigned to ${idea.assignments.length} reviewers`);
    }
    for (const a of s.users.filter((u) => can(s, u, 'idea.screen') && u.role === 'admin')) notify(s, a.id, 'New submission', `${idea.ref} “${idea.title}” was submitted to ${c.title}.`, `/app/pipeline`);
  });
  return receipt(idea);
}

export function receipt(idea: Idea) {
  const v = idea.versions[idea.versions.length - 1];
  const payload = `${idea.ref}|v${v?.n ?? 0}|${v?.at ?? ''}|${sha256(JSON.stringify(v?.answers ?? {}))}`;
  return { ref: idea.ref, version: v?.n ?? 0, at: v?.at ?? '', fingerprint: sha256(payload) };
}

export function withdrawIdea(user: User, ideaId: string) {
  const idea = ideaById(ideaId);
  if (idea.ownerId !== user.id) throw new ActionError('Only the owner can withdraw.');
  store.commit('idea.withdrawn', (s) => setStatus(s, idea, user, 'withdrawn', 'Withdrawn by innovator'));
}

export function postMessage(user: User, ideaId: string, body: string, visibility: 'shared' | 'internal') {
  const idea = ideaById(ideaId);
  const isOwner = idea.ownerId === user.id;
  const isStaffSide = can(S(), user, 'idea.view.pipeline') || can(S(), user, 'review.submit') || can(S(), user, 'idea.screen');
  if (!isOwner && !isStaffSide) throw new ActionError('You cannot comment on this idea.');
  if (isOwner && visibility === 'internal') throw new ActionError('Innovators cannot post internal notes.');
  if (user.role === 'observer') throw new ActionError('Observers have read-only access.');
  if (!body.trim()) throw new ActionError('Message is empty.');
  store.commit('idea.message', (s) => {
    idea.thread.push({ id: uid('m'), authorId: user.id, body: body.trim(), at: now(), visibility, kind: isOwner ? 'reply' : visibility === 'internal' ? 'note' : 'feedback' });
    idea.updatedAt = now();
    appendAudit(s, user, visibility === 'internal' ? 'idea.internal_note' : 'idea.feedback', idea.ref, `${body.trim().length} characters`);
    if (isOwner) {
      for (const a of s.users.filter((u) => u.role === 'admin')) notify(s, a.id, `Reply on ${idea.ref}`, `${user.name} replied to feedback.`, `/app/ideas/${idea.id}`);
    } else if (visibility === 'shared') {
      notify(s, idea.ownerId, `New feedback on ${idea.title}`, body.trim().slice(0, 140), `/app/ideas/${idea.id}`);
    }
  });
}

export function resubmit(user: User, ideaId: string, note: string) {
  const idea = ideaById(ideaId);
  if (idea.ownerId !== user.id) throw new ActionError('Only the owner can resubmit.');
  if (idea.status !== 'revision') throw new ActionError('Only ideas returned for revision can be resubmitted.');
  if (note.trim().length < 10) throw new ActionError('Tell the reviewers briefly what you changed (at least 10 characters).');
  const c = campaignOf(idea);
  const missing = validateIdea(c, idea);
  if (missing.length) throw new ActionError(`Please complete: ${missing.map((m) => m.label).join('; ')}`);
  store.commit('idea.resubmitted', (s) => {
    idea.versions.push({ n: idea.versions.length + 1, at: now(), title: idea.title, summary: idea.summary, answers: { ...idea.answers }, note: note.trim() });
    idea.round += 1;
    setStatus(s, idea, user, 'submitted', `Resubmitted as version ${idea.versions.length}: ${note.trim()}`);
    // Same reviewers re-score the new version, so feedback is checked by the people who gave it.
    idea.assignments = idea.assignments.filter((a) => !a.conflict?.declared).map((a) => ({ ...a, assignedAt: now(), dueAt: new Date(Date.now() + 7 * DAY).toISOString() }));
    if (idea.assignments.length < c.levels.reviewersPerIdea) autoAssign(s, idea, c);
    setStatus(s, idea, user, 'in_review', `Round ${idea.round}: back with the same reviewers`);
    for (const a of idea.assignments) notify(s, a.reviewerId, `Revised idea to re-score`, `${idea.ref} was resubmitted. See what changed and update your score.`, `/app/review/${idea.id}`);
  });
}

// ---------------------------------------------------------------- screening and assignment

function autoAssign(state: State, idea: Idea, c: Campaign) {
  const reviewers = state.users.filter((u) => can(state, u, 'review.submit') && !u.disabled);
  const load = (id: string) => state.ideas.filter((i) => ['in_review', 'submitted', 'screening'].includes(i.status) && i.assignments.some((a) => a.reviewerId === id && !a.conflict?.declared)).length;
  const already = new Set(idea.assignments.map((a) => a.reviewerId));
  const ranked = reviewers
    .filter((u) => !already.has(u.id) && u.id !== idea.ownerId)
    .map((u) => ({ u, fit: (u.expertise ?? []).includes(idea.sector) ? 1 : 0, load: load(u.id) }))
    .sort((a, b) => b.fit - a.fit || a.load - b.load);
  while (idea.assignments.filter((a) => !a.conflict?.declared).length < c.levels.reviewersPerIdea && ranked.length) {
    const next = ranked.shift()!;
    idea.assignments.push({ reviewerId: next.u.id, assignedAt: now(), dueAt: new Date(Date.now() + 10 * DAY).toISOString() });
    notify(state, next.u.id, 'New idea to review', `${idea.ref} has been assigned to you. Please declare any conflict before opening it.`, `/app/review/${idea.id}`);
  }
}

export function screen(user: User, ideaId: string, checks: Record<string, boolean>, note: string) {
  assertCan(S(), user, 'idea.screen');
  const idea = ideaById(ideaId);
  const c = campaignOf(idea);
  const passed = Object.values(checks).every(Boolean);
  store.commit('idea.screened', (s) => {
    if (idea.status === 'submitted') setStatus(s, idea, user, 'screening', 'Screening started');
    idea.screening = { by: user.id, at: now(), passed, checks, note };
    if (passed) {
      autoAssign(s, idea, c);
      setStatus(s, idea, user, 'in_review', `Passed screening; assigned to ${idea.assignments.length} reviewers`);
    } else {
      idea.thread.push({ id: uid('m'), authorId: user.id, body: note || 'Your submission is missing information. Please update it and resubmit.', at: now(), visibility: 'shared', kind: 'feedback' });
      setStatus(s, idea, user, 'revision', 'Incomplete at screening; returned to innovator');
    }
  });
}

export function declareConflict(user: User, ideaId: string, declared: boolean, note = '') {
  assertCan(S(), user, 'review.submit');
  const idea = ideaById(ideaId);
  const a = idea.assignments.find((x) => x.reviewerId === user.id);
  if (!a) throw new ActionError('This idea is not assigned to you.');
  store.commit('review.conflict', (s) => {
    a.conflict = { declared, note, at: now() };
    appendAudit(s, user, declared ? 'review.conflict_declared' : 'review.no_conflict', idea.ref, note);
    if (declared) autoAssign(s, idea, campaignOf(idea));
  });
}

export function submitReview(user: User, ideaId: string, input: { scores: Record<string, number>; comments: Record<string, string>; overall: string; recommendation: 'advance' | 'revise' | 'decline' }) {
  assertCan(S(), user, 'review.submit');
  const idea = ideaById(ideaId);
  const a = idea.assignments.find((x) => x.reviewerId === user.id);
  if (!a) throw new ActionError('This idea is not assigned to you.');
  if (!a.conflict || a.conflict.declared) throw new ActionError('Confirm you have no conflict of interest first.');
  if (idea.status !== 'in_review') throw new ActionError('This idea is not open for review.');
  const c = campaignOf(idea);
  for (const cr of c.criteria) {
    const v = input.scores[cr.id];
    if (!v || v < 1 || v > 5) throw new ActionError(`Score “${cr.name}” from 1 to 5.`);
    if (!input.comments[cr.id]?.trim()) throw new ActionError(`Add a short comment for “${cr.name}”: innovators see these as feedback.`);
  }
  if (input.overall.trim().length < 15) throw new ActionError('Write an overall comment (at least 15 characters).');
  store.commit('review.submitted', (s) => {
    idea.reviews = idea.reviews.filter((r) => !(r.reviewerId === user.id && r.round === idea.round));
    idea.reviews.push({ id: uid('rv'), reviewerId: user.id, round: idea.round, ...input, submittedAt: now() });
    appendAudit(s, user, 'review.submitted', idea.ref, `Round ${idea.round}, recommendation: ${input.recommendation}`);
    const active = idea.assignments.filter((x) => !x.conflict?.declared);
    const done = active.every((x) => idea.reviews.some((r) => r.reviewerId === x.reviewerId && r.round === idea.round));
    if (done) {
      setStatus(s, idea, user, 'committee', 'All reviews in; sent to committee');
      for (const m of s.users.filter((u) => can(s, u, 'idea.decide'))) notify(s, m.id, 'Idea ready for committee', `${idea.ref} has all its scores.`, `/app/committee/${idea.id}`);
    }
  });
}

export function returnForRevision(user: User, ideaId: string, message: string) {
  if (!can(S(), user, 'idea.screen') && !can(S(), user, 'idea.decide')) throw new ActionError('Not allowed.');
  const idea = ideaById(ideaId);
  if (message.trim().length < 15) throw new ActionError('Explain what needs to change (at least 15 characters).');
  store.commit('idea.revision', (s) => {
    idea.thread.push({ id: uid('m'), authorId: user.id, body: message.trim(), at: now(), visibility: 'shared', kind: 'feedback' });
    setStatus(s, idea, user, 'revision', 'Returned for revision with feedback');
  });
}

// ---------------------------------------------------------------- committee

export function castVote(user: User, ideaId: string, vote: 'approve' | 'revise' | 'decline') {
  assertCan(S(), user, 'idea.decide');
  const idea = ideaById(ideaId);
  if (idea.status !== 'committee') throw new ActionError('This idea is not at committee.');
  store.commit('committee.vote', (s) => {
    idea.decision = idea.decision ?? { by: '', at: '', outcome: 'approve', rationale: '', votes: {} };
    idea.decision.votes[user.id] = vote;
    appendAudit(s, user, 'committee.vote', idea.ref, vote);
  });
}

export function finaliseDecision(user: User, ideaId: string, outcome: 'approve' | 'revise' | 'decline', rationale: string) {
  assertCan(S(), user, 'idea.decide');
  const idea = ideaById(ideaId);
  const c = campaignOf(idea);
  const votes = idea.decision?.votes ?? {};
  if (Object.keys(votes).length < c.levels.committeeQuorum) throw new ActionError(`Quorum not met: ${Object.keys(votes).length} of ${c.levels.committeeQuorum} votes cast.`);
  if (rationale.trim().length < 20) throw new ActionError('Record the reason for the decision (at least 20 characters). It is shared with the innovator.');
  store.commit('committee.decision', (s) => {
    idea.decision = { ...idea.decision!, by: user.id, at: now(), outcome, rationale: rationale.trim() };
    idea.thread.push({ id: uid('m'), authorId: user.id, body: `Committee decision: ${rationale.trim()}`, at: now(), visibility: 'shared', kind: 'feedback' });
    const to: Status = outcome === 'approve' ? 'approved' : outcome === 'revise' ? 'revision' : 'declined';
    setStatus(s, idea, user, to, `Committee: ${outcome} (${Object.values(votes).filter((v) => v === outcome).length} of ${Object.keys(votes).length} votes)`);
  });
}

export function confirmAward(user: User, ideaId: string, amount: number, plan: { title: string; due: string; tranche: number }[]) {
  assertCan(S(), user, 'idea.award');
  const idea = ideaById(ideaId);
  if (idea.status !== 'approved') throw new ActionError('Only approved ideas can be awarded.');
  const c = campaignOf(idea);
  if (c.maxAward && amount > c.maxAward) throw new ActionError(`Maximum award for this call is P${c.maxAward.toLocaleString()}.`);
  const sum = plan.reduce((a, m) => a + m.tranche, 0);
  if (amount && sum !== amount) throw new ActionError(`Tranches add up to P${sum.toLocaleString()}, but the award is P${amount.toLocaleString()}.`);
  store.commit('idea.awarded', (s) => {
    idea.award = { amount, at: now(), code: sha256(`award:${idea.ref}:${amount}:${now()}`).slice(0, 12).toUpperCase() };
    idea.milestones = plan.map((m, i): Milestone => ({ id: uid('ms'), title: m.title, due: m.due, tranche: m.tranche, status: i === 0 ? 'in_progress' : 'planned' }));
    idea.showcase = true;
    setStatus(s, idea, user, 'awarded', amount ? `Award confirmed: P${amount.toLocaleString('en-BW')}` : 'Recognition confirmed');
    setStatus(s, idea, user, 'development', 'Milestone plan agreed');
  });
}

export function submitEvidence(user: User, ideaId: string, milestoneId: string, evidence: string) {
  const idea = ideaById(ideaId);
  if (idea.ownerId !== user.id) throw new ActionError('Only the innovator can submit evidence.');
  const m = idea.milestones.find((x) => x.id === milestoneId);
  if (!m) throw new ActionError('Milestone not found.');
  if (evidence.trim().length < 10) throw new ActionError('Describe the evidence (at least 10 characters).');
  store.commit('milestone.evidence', (s) => {
    m.status = 'evidence';
    m.evidence = evidence.trim();
    appendAudit(s, user, 'milestone.evidence', idea.ref, m.title);
    for (const a of s.users.filter((u) => u.role === 'admin')) notify(s, a.id, 'Milestone evidence submitted', `${idea.ref}: ${m.title}`, `/app/ideas/${idea.id}`);
  });
}

export function verifyMilestone(user: User, ideaId: string, milestoneId: string) {
  assertCan(S(), user, 'idea.award');
  const idea = ideaById(ideaId);
  const m = idea.milestones.find((x) => x.id === milestoneId);
  if (!m || m.status !== 'evidence') throw new ActionError('There is no evidence to verify yet.');
  store.commit('milestone.verified', (s) => {
    m.status = 'verified';
    const next = idea.milestones.find((x) => x.status === 'planned');
    if (next) next.status = 'in_progress';
    appendAudit(s, user, 'milestone.verified', idea.ref, `${m.title}; tranche P${m.tranche.toLocaleString()} released`);
    notify(s, idea.ownerId, 'Milestone verified', `“${m.title}” is verified. Tranche of P${m.tranche.toLocaleString('en-BW')} released.`, `/app/ideas/${idea.id}`);
  });
}

// ---------------------------------------------------------------- public alerts and showcase

export function subscribeAlerts(ref: string, contact: string) {
  const idea = S().ideas.find((i) => i.ref.toLowerCase() === ref.trim().toLowerCase());
  if (!idea) throw new ActionError('No idea found with that reference.');
  const c = contact.trim();
  const channel: 'email' | 'sms' = c.includes('@') ? 'email' : 'sms';
  if (channel === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) throw new ActionError('Enter a valid email address or phone number.');
  if (channel === 'sms' && !/^\+?\d[\d\s]{7,14}$/.test(c)) throw new ActionError('Enter a valid email address or phone number.');
  store.commit('alerts.subscribed', (s) => {
    if (!idea.watchers.some((w) => w.contact === c)) idea.watchers.push({ contact: c, channel, at: now() });
    s.outbox.unshift({ id: uid('alert'), to: c, channel, subject: `[Letsema] You will get updates on ${idea.ref}`, body: `Free alerts are on for ${idea.ref}. We will message you each time it changes stage. Reply STOP to unsubscribe.`, at: now() });
    appendAudit(s, null, 'alerts.subscribed', idea.ref, channel);
  });
}

export function cheer(ideaId: string) {
  store.commit('idea.cheer', () => { const i = ideaById(ideaId); i.cheers += 1; });
}

export function markRead(user: User, id?: string) {
  store.commit('notifications.read', (s) => {
    for (const n of s.notifications) if (n.userId === user.id && (!id || n.id === id)) n.read = true;
  });
}

// ---------------------------------------------------------------- administration

export function saveCampaign(user: User, c: Campaign) {
  assertCan(S(), user, 'campaign.manage');
  if (c.title.trim().length < 5) throw new ActionError('Give the call a title.');
  if (!c.criteria.length) throw new ActionError('Add at least one scoring criterion.');
  if (c.criteria.some((x) => !x.name.trim() || x.weight <= 0)) throw new ActionError('Every criterion needs a name and a weight above zero.');
  if (!c.form.length) throw new ActionError('Add at least one form question.');
  if (new Date(c.closes) <= new Date(c.opens)) throw new ActionError('The closing date must be after the opening date.');
  store.commit('campaign.saved', (s) => {
    const i = s.campaigns.findIndex((x) => x.id === c.id);
    const next = { ...c, updatedAt: now(), slug: c.slug || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };
    if (i >= 0) s.campaigns[i] = next; else s.campaigns.push(next);
    appendAudit(s, user, i >= 0 ? 'campaign.updated' : 'campaign.created', c.id, `${c.title} (${c.status})`);
  });
}

export function deleteCampaign(user: User, id: string) {
  assertCan(S(), user, 'campaign.manage');
  if (S().ideas.some((i) => i.campaignId === id)) throw new ActionError('This call has ideas. Close it instead of deleting it.');
  store.commit('campaign.deleted', (s) => {
    s.campaigns = s.campaigns.filter((c) => c.id !== id);
    appendAudit(s, user, 'campaign.deleted', id, '');
  });
}

export function savePage(user: User, p: Page) {
  assertCan(S(), user, 'content.manage');
  store.commit('content.page', (s) => {
    const i = s.pages.findIndex((x) => x.id === p.id);
    if (i >= 0) s.pages[i] = { ...p, updatedAt: now() }; else s.pages.push({ ...p, updatedAt: now() });
    appendAudit(s, user, i >= 0 ? 'content.page_updated' : 'content.page_created', p.slug, p.title);
  });
}
export function deletePage(user: User, id: string) {
  assertCan(S(), user, 'content.manage');
  store.commit('content.page_deleted', (s) => { s.pages = s.pages.filter((p) => p.id !== id); appendAudit(s, user, 'content.page_deleted', id, ''); });
}
export function saveFaq(user: User, f: Faq) {
  assertCan(S(), user, 'content.manage');
  store.commit('content.faq', (s) => {
    const i = s.faqs.findIndex((x) => x.id === f.id);
    if (i >= 0) s.faqs[i] = f; else s.faqs.push(f);
    appendAudit(s, user, i >= 0 ? 'content.faq_updated' : 'content.faq_created', f.id, f.q.slice(0, 60));
  });
}
export function deleteFaq(user: User, id: string) {
  assertCan(S(), user, 'content.manage');
  store.commit('content.faq_deleted', (s) => { s.faqs = s.faqs.filter((f) => f.id !== id); appendAudit(s, user, 'content.faq_deleted', id, ''); });
}
export function uploadDocument(user: User, d: DocumentFile) {
  assertCan(S(), user, 'content.manage');
  store.commit('content.document', (s) => {
    s.documents.push(d);
    appendAudit(s, user, 'content.document_uploaded', d.name, `sha256 ${d.sha256.slice(0, 16)}…`);
  });
}
export function deleteDocument(user: User, id: string) {
  assertCan(S(), user, 'content.manage');
  store.commit('content.document_deleted', (s) => {
    const d = s.documents.find((x) => x.id === id);
    s.documents = s.documents.filter((x) => x.id !== id);
    appendAudit(s, user, 'content.document_deleted', d?.name ?? id, '');
  });
}
export function saveNotice(user: User, n: Notice) {
  assertCan(S(), user, 'content.manage');
  store.commit('content.notice', (s) => {
    const i = s.notices.findIndex((x) => x.id === n.id);
    if (i >= 0) s.notices[i] = n; else s.notices.unshift(n);
    appendAudit(s, user, 'content.notice', n.id, `${n.title} (${n.active ? 'on' : 'off'})`);
  });
}

export function setUserRole(user: User, targetId: string, role: string) {
  assertCan(S(), user, 'users.manage');
  if (targetId === user.id) throw new ActionError('You cannot change your own role.');
  store.commit('user.role', (s) => {
    const t = s.users.find((u) => u.id === targetId)!;
    const from = t.role;
    t.role = role;
    appendAudit(s, user, 'user.role_changed', t.id, `${from} → ${role}`);
    notify(s, t.id, 'Your access changed', `Your role is now ${role}.`);
  });
}

export function setUserDisabled(user: User, targetId: string, disabled: boolean) {
  assertCan(S(), user, 'users.manage');
  if (targetId === user.id) throw new ActionError('You cannot disable yourself.');
  store.commit('user.disabled', (s) => {
    const t = s.users.find((u) => u.id === targetId)!;
    t.disabled = disabled;
    appendAudit(s, user, disabled ? 'user.disabled' : 'user.enabled', t.id, '');
  });
}

export function saveRole(user: User, role: RoleDef) {
  assertCan(S(), user, 'users.manage');
  if (!/^[a-z][a-z0-9_-]{2,30}$/.test(role.key)) throw new ActionError('Role key: lowercase letters, numbers, - or _, 3–30 characters.');
  if (role.key === 'admin' && !role.permissions.includes('users.manage')) throw new ActionError('Administrators must keep “Manage users and roles”, or nobody could fix access.');
  store.commit('role.saved', (s) => {
    const i = s.settings.roles.findIndex((r) => r.key === role.key);
    if (i >= 0) s.settings.roles[i] = role; else s.settings.roles.push(role);
    appendAudit(s, user, i >= 0 ? 'role.updated' : 'role.created', role.key, role.permissions.join(', '));
  });
}

export function togglePermission(user: User, roleKey: string, perm: Permission) {
  const r = S().settings.roles.find((x) => x.key === roleKey);
  if (!r) return;
  const has = r.permissions.includes(perm);
  saveRole(user, { ...r, permissions: has ? r.permissions.filter((p) => p !== perm) : [...r.permissions, perm] });
}

export function setTheme(user: User, theme: Theme) {
  assertCan(S(), user, 'settings.manage');
  store.commit('settings.theme', (s) => { s.settings.theme = theme; appendAudit(s, user, 'settings.theme', theme.preset, `${theme.primary} / ${theme.accent} / ${theme.font}`); });
}

export function setChatHours(user: User, chat: State['settings']['chat']) {
  assertCan(S(), user, 'settings.manage');
  store.commit('settings.chat', (s) => { s.settings.chat = chat; appendAudit(s, user, 'settings.chat_hours', 'chat', `${chat.open}–${chat.close}`); });
}

export function toggleWebhook(user: User, id: string) {
  assertCan(S(), user, 'settings.manage');
  store.commit('settings.webhook', (s) => {
    const w = s.settings.webhooks.find((x) => x.id === id)!;
    w.active = !w.active;
    appendAudit(s, user, 'settings.webhook', w.url, w.active ? 'enabled' : 'disabled');
  });
}

// ---------------------------------------------------------------- live chat

export function startChat(input: { name: string; userId?: string; topic: string; message: string; open: boolean; offlineMessage: string }): string {
  const id = uid('ch');
  store.commit('chat.started', (s) => {
    const conv: Conversation = {
      id, visitorName: input.name.trim() || 'Visitor', visitorId: input.userId, topic: input.topic, status: input.open ? 'waiting' : 'missed', startedAt: now(),
      messages: [{ from: 'visitor', body: input.message.trim(), at: now() }],
    };
    if (!input.open) conv.messages.push({ from: 'system', body: input.offlineMessage, at: now() });
    else {
      const agents = s.users.filter((u) => can(s, u, 'chat.answer'));
      const busy = agents.every((a) => s.conversations.filter((c) => c.agentId === a.id && c.status === 'active').length >= s.settings.chat.maxPerAgent);
      conv.messages.push({ from: 'system', body: busy ? 'All consultants are busy at the moment. You are in the queue and will be answered in turn.' : 'Thanks! A CEDA consultant will join shortly.', at: now() });
      for (const a of agents) notify(s, a.id, 'New chat waiting', `${conv.visitorName}: ${input.message.slice(0, 80)}`, '/app/chat');
    }
    s.conversations.unshift(conv);
    appendAudit(s, input.userId ? { id: input.userId, role: 'innovator' } : null, input.open ? 'chat.started' : 'chat.offline_message', id, input.topic);
  });
  return id;
}

export function chatSend(convId: string, from: 'visitor' | 'agent', body: string, agent?: User) {
  if (!body.trim()) return;
  if (from === 'agent') assertCan(S(), agent, 'chat.answer');
  store.commit('chat.message', (s) => {
    const c = s.conversations.find((x) => x.id === convId);
    if (!c) return;
    if (from === 'agent') {
      if (!c.agentId) c.agentId = agent!.id;
      if (!c.firstResponseAt) c.firstResponseAt = now();
      if (c.status === 'waiting') c.status = 'active';
    }
    c.messages.push({ from, agentId: agent?.id, body: body.trim(), at: now() });
  });
}

export function claimChat(agent: User, convId: string) {
  assertCan(S(), agent, 'chat.answer');
  store.commit('chat.claimed', (s) => {
    const c = s.conversations.find((x) => x.id === convId);
    if (!c) return;
    c.agentId = agent.id;
    c.status = 'active';
    c.messages.push({ from: 'system', body: `${agent.name} joined the chat.`, at: now() });
    appendAudit(s, agent, 'chat.claimed', convId, '');
  });
}

export function closeChat(convId: string, by: User | null, rating?: number) {
  store.commit('chat.closed', (s) => {
    const c = s.conversations.find((x) => x.id === convId);
    if (!c) return;
    if (c.status !== 'missed') c.status = 'closed';
    c.closedAt = c.closedAt ?? now();
    if (rating) c.rating = rating;
    appendAudit(s, by, 'chat.closed', convId, rating ? `rated ${rating}/5` : '');
  });
}

// ---------------------------------------------------------------- privacy (Data Protection Act, 2024)

export function exportMyData(user: User) {
  const s = S();
  const data = {
    exportedAt: now(),
    notice: 'Your personal data held by the Letsema portal (Data Protection Act, 2024: right of access).',
    profile: { ...user, passwordHash: '[hidden]' },
    ideas: s.ideas.filter((i) => i.ownerId === user.id).map((i) => ({ ...i, reviews: i.reviews.map((r) => ({ ...r, reviewerId: 'anonymous' })), thread: i.thread.filter((m) => m.visibility === 'shared') })),
    notifications: s.notifications.filter((n) => n.userId === user.id),
    chats: s.conversations.filter((c) => c.visitorId === user.id),
    activity: s.audit.filter((a) => a.actorId === user.id),
  };
  store.commit('privacy.export', (st) => {
    st.privacy.unshift({ id: uid('pr'), userId: user.id, kind: 'export', at: now(), status: 'done' });
    appendAudit(st, user, 'privacy.export', user.id, 'Self-service data export');
  });
  return JSON.stringify(data, null, 2);
}

export function requestPrivacy(user: User, kind: 'erase' | 'correct', note: string) {
  store.commit('privacy.request', (s) => {
    s.privacy.unshift({ id: uid('pr'), userId: user.id, kind, at: now(), status: 'open', note });
    appendAudit(s, user, `privacy.${kind}_requested`, user.id, note.slice(0, 80));
    for (const a of s.users.filter((u) => can(s, u, 'privacy.manage'))) notify(s, a.id, 'Data-protection request', `${user.name} asked to ${kind} their data.`, '/app/privacy');
  });
}

export function resolvePrivacy(user: User, id: string) {
  assertCan(S(), user, 'privacy.manage');
  store.commit('privacy.resolved', (s) => {
    const r = s.privacy.find((x) => x.id === id)!;
    r.status = 'done';
    if (r.kind === 'erase') {
      const u = s.users.find((x) => x.id === r.userId);
      if (u) {
        // Pseudonymise rather than delete rows, so evaluation records and the audit chain stay intact.
        u.name = 'Erased user';
        u.email = `erased-${u.id}@invalid`;
        u.phone = undefined;
        u.org = undefined;
        u.disabled = true;
      }
    }
    appendAudit(s, user, 'privacy.resolved', id, r.kind);
    notify(s, r.userId, 'Your data request is complete', `Your ${r.kind} request has been completed.`);
  });
}

export function resetDemo() {
  store.reset();
}
