import {
  pgTable, text, integer, boolean, timestamp, jsonb, serial, real, primaryKey, index, uniqueIndex, customType,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' });
const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const created = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });

export const ROLES = ['innovator', 'evaluator', 'panel', 'observer', 'consultant', 'partner_admin', 'admin', 'superadmin'] as const;
export type Role = (typeof ROLES)[number];

/** An organiser space: CEDA itself, or a partner such as BDIH or BTC. */
export const spaces = pgTable('spaces', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  short: text('short').notNull(),
  about: text('about').notNull().default(''),
  primary: text('primary_color').notNull().default('#d94914'),
  accent: text('accent_color').notNull().default('#f4a62a'),
  active: boolean('active').notNull().default(true),
  createdAt: created(),
});

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  name: text('name').notNull(),
  title: text('title'),
  role: text('role').$type<Role>().notNull().default('innovator'),
  spaceId: text('space_id').references(() => spaces.id, { onDelete: 'set null' }),
  passwordHash: text('password_hash').notNull(),
  omang: text('omang'),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  district: text('district'),
  organisation: text('organisation'),
  cipaNumber: text('cipa_number'),
  youthShare: integer('youth_share'),
  expertise: text('expertise'),
  emailVerifiedAt: ts('email_verified_at'),
  phoneVerifiedAt: ts('phone_verified_at'),
  consentAt: ts('consent_at'),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: ts('locked_until'),
  alerts: jsonb('alerts').$type<{ email: boolean; sms: boolean; inapp: boolean }>().notNull().default({ email: true, sms: false, inapp: true }),
  erasedAt: ts('erased_at'),
  createdAt: created(),
});

/** Server-side sessions: the cookie holds a random token, we store only its hash. */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  method: text('method').notNull(),
  userAgent: text('user_agent'),
  createdAt: created(),
  expiresAt: ts('expires_at').notNull(),
}, (t) => [index('sessions_user').on(t.userId)]);

/** WebAuthn passkeys (fingerprint / face / device PIN). */
export const passkeys = pgTable('passkeys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').notNull().default(0),
  transports: jsonb('transports').$type<string[]>().notNull().default([]),
  label: text('label').notNull().default('Passkey'),
  createdAt: created(),
});

/** One-time codes sent by email or SMS (verification, sign-in, password reset). */
export const codes = pgTable('codes', {
  id: id(),
  target: text('target').notNull(),
  purpose: text('purpose').$type<'verify_email' | 'verify_phone' | 'login' | 'reset'>().notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: ts('expires_at').notNull(),
  usedAt: ts('used_at'),
  createdAt: created(),
}, (t) => [index('codes_target').on(t.target, t.purpose)]);

export type FieldDef = {
  key: string; label: string; help?: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'url';
  required?: boolean; options?: string[]; maxWords?: number; accept?: string[]; maxMb?: number; maxPages?: number;
};
export type Criterion = { key: string; label: string; weight: number; guide: string };
export type Stage = { key: string; label: string; starts: string; ends: string; note?: string };
export type InstanceDefinition = {
  kind: 'hackathon' | 'call' | 'ideas' | 'accelerator';
  audience: 'public' | 'staff';
  stages: Stage[];
  form: FieldDef[];
  rubric: Criterion[];
  eligibility: { minAge?: number; maxAge?: number; citizenOnly?: boolean; minYouthShare?: number; cipaRequired?: boolean };
  team: { min: number; max: number };
  reviewersPerEntry: number;
  shortlistSize: number;
  prizes: { place: string; amount: number }[];
  sectors: string[];
};

/** An Instance: one sealed, versioned run of a challenge, call or programme. */
export const instances = pgTable('instances', {
  id: id(),
  spaceId: text('space_id').notNull().references(() => spaces.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull().default(''),
  description: text('description').notNull().default(''),
  photo: text('photo'),
  status: text('status').$type<'draft' | 'live' | 'closed' | 'archived'>().notNull().default('draft'),
  definition: jsonb('definition').$type<InstanceDefinition>().notNull(),
  rulesHash: text('rules_hash').notNull(),
  version: integer('version').notNull().default(1),
  opensAt: ts('opens_at'),
  closesAt: ts('closes_at'),
  featured: boolean('featured').notNull().default(false),
  createdById: text('created_by').references(() => users.id),
  createdAt: created(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const instanceVersions = pgTable('instance_versions', {
  id: id(),
  instanceId: text('instance_id').notNull().references(() => instances.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  reason: text('reason').notNull(),
  definition: jsonb('definition').$type<InstanceDefinition>().notNull(),
  rulesHash: text('rules_hash').notNull(),
  changes: jsonb('changes').$type<string[]>().notNull().default([]),
  byId: text('by_id').references(() => users.id),
  createdAt: created(),
}, (t) => [uniqueIndex('instance_version_unique').on(t.instanceId, t.version)]);

/** Per-Instance roles: who organises, evaluates, sits on the panel or observes a given run. */
export const instanceRoles = pgTable('instance_roles', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  instanceId: text('instance_id').notNull().references(() => instances.id, { onDelete: 'cascade' }),
  role: text('role').$type<'organiser' | 'evaluator' | 'panel' | 'observer' | 'mentor'>().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.instanceId, t.role] })]);

export type TeamMember = { name: string; email: string; omang?: string; role?: string; share?: number; lead?: boolean };

export const ENTRY_STATUSES = ['draft', 'submitted', 'screening', 'in_review', 'returned', 'shortlisted', 'awarded', 'declined', 'withdrawn'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const entries = pgTable('entries', {
  id: id(),
  ref: text('ref').notNull().unique(),
  instanceId: text('instance_id').notNull().references(() => instances.id, { onDelete: 'cascade' }),
  innovatorId: text('innovator_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  sector: text('sector'),
  district: text('district'),
  answers: jsonb('answers').$type<Record<string, string>>().notNull().default({}),
  team: jsonb('team').$type<TeamMember[]>().notNull().default([]),
  status: text('status').$type<EntryStatus>().notNull().default('draft'),
  version: integer('version').notNull().default(0),
  sealHash: text('seal_hash'),
  rulesHashAtSubmit: text('rules_hash_at_submit'),
  score: real('score'),
  rank: integer('rank'),
  awardAmount: integer('award_amount'),
  awardCode: text('award_code'),
  decisionNote: text('decision_note'),
  showcase: boolean('showcase').notNull().default(false),
  cheers: integer('cheers').notNull().default(0),
  submittedAt: ts('submitted_at'),
  decidedAt: ts('decided_at'),
  createdAt: created(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('entries_instance').on(t.instanceId, t.status), index('entries_innovator').on(t.innovatorId)]);

/** Every submitted version is kept so reviewers can see what changed on resubmission. */
export const entryVersions = pgTable('entry_versions', {
  id: id(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  answers: jsonb('answers').$type<Record<string, string>>().notNull(),
  sealHash: text('seal_hash').notNull(),
  createdAt: created(),
});

export const entryFiles = pgTable('entry_files', {
  id: id(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  field: text('field').notNull(),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  detected: text('detected').notNull(),
  size: integer('size').notNull(),
  sha256: text('sha256').notNull(),
  pages: integer('pages'),
  content: bytea('content').notNull(),
  createdAt: created(),
}, (t) => [index('files_entry').on(t.entryId)]);

/** Automatic pre-flight checks run on submission (eligibility, file type, size, secrets, completeness). */
export const checks = pgTable('checks', {
  id: id(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  label: text('label').notNull(),
  status: text('status').$type<'pass' | 'warn' | 'fail'>().notNull(),
  detail: text('detail').notNull().default(''),
  createdAt: created(),
});

export const evaluations = pgTable('evaluations', {
  id: id(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  evaluatorId: text('evaluator_id').notNull().references(() => users.id),
  dueAt: ts('due_at').notNull(),
  conflict: boolean('conflict'),
  conflictNote: text('conflict_note'),
  scores: jsonb('scores').$type<Record<string, number>>(),
  total: real('total'),
  feedback: text('feedback'),
  privateNote: text('private_note'),
  submittedAt: ts('submitted_at'),
  createdAt: created(),
}, (t) => [uniqueIndex('eval_unique').on(t.entryId, t.evaluatorId), index('eval_evaluator').on(t.evaluatorId)]);

export const votes = pgTable('votes', {
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  vote: text('vote').$type<'award' | 'decline' | 'discuss'>().notNull(),
  amount: integer('amount'),
  note: text('note'),
  createdAt: created(),
}, (t) => [primaryKey({ columns: [t.entryId, t.userId] })]);

/** Feedback and clarification thread on an entry. internal=true is hidden from the innovator. */
export const messages = pgTable('messages', {
  id: id(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  internal: boolean('internal').notNull().default(false),
  kind: text('kind').$type<'message' | 'feedback' | 'revision_request' | 'system'>().notNull().default('message'),
  createdAt: created(),
}, (t) => [index('messages_entry').on(t.entryId, t.createdAt)]);

/** Tamper-evident audit trail: each row's hash covers the previous row's hash. */
export const audit = pgTable('audit', {
  seq: serial('seq').primaryKey(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  actorId: text('actor_id'),
  actorName: text('actor_name').notNull(),
  action: text('action').notNull(),
  instanceId: text('instance_id'),
  entryId: text('entry_id'),
  detail: jsonb('detail').$type<Record<string, unknown>>().notNull().default({}),
  ip: text('ip'),
  prevHash: text('prev_hash').notNull(),
  hash: text('hash').notNull(),
});

export const notifications = pgTable('notifications', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  readAt: ts('read_at'),
  createdAt: created(),
}, (t) => [index('notif_user').on(t.userId, t.createdAt)]);

/** Every email and SMS the portal sends. In demo mode they are shown in the demo inbox instead of being delivered. */
export const outbox = pgTable('outbox', {
  id: id(),
  channel: text('channel').$type<'email' | 'sms'>().notNull(),
  to: text('to').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  createdAt: created(),
}, (t) => [index('outbox_to').on(t.to, t.createdAt)]);

/** Free alerts. Anyone can follow an entry by its reference, no account needed. */
export const subscriptions = pgTable('subscriptions', {
  id: id(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  contact: text('contact').notNull(),
  channel: text('channel').$type<'email' | 'sms'>().notNull(),
  entryId: text('entry_id').references(() => entries.id, { onDelete: 'cascade' }),
  instanceId: text('instance_id').references(() => instances.id, { onDelete: 'cascade' }),
  token: text('token').notNull().$defaultFn(() => crypto.randomUUID()),
  active: boolean('active').notNull().default(true),
  createdAt: created(),
});

export const threads = pgTable('threads', {
  id: id(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  category: text('category').notNull(),
  pinned: boolean('pinned').notNull().default(false),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: created(),
});

export const replies = pgTable('replies', {
  id: id(),
  threadId: text('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: created(),
});

/** Admin-managed content: pages, FAQs, notices and downloadable documents. */
export const content = pgTable('content', {
  id: id(),
  kind: text('kind').$type<'page' | 'faq' | 'notice' | 'document'>().notNull(),
  slug: text('slug'),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  category: text('category'),
  url: text('url'),
  sort: integer('sort').notNull().default(0),
  published: boolean('published').notNull().default(true),
  updatedById: text('updated_by').references(() => users.id),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const chats = pgTable('chats', {
  id: id(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestName: text('guest_name'),
  guestContact: text('guest_contact'),
  consultantId: text('consultant_id').references(() => users.id),
  topic: text('topic').notNull().default('General'),
  status: text('status').$type<'waiting' | 'active' | 'closed' | 'offline'>().notNull().default('waiting'),
  rating: integer('rating'),
  firstReplyAt: ts('first_reply_at'),
  closedAt: ts('closed_at'),
  createdAt: created(),
});

export const chatMessages = pgTable('chat_messages', {
  id: id(),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  from: text('from').$type<'user' | 'consultant' | 'system'>().notNull(),
  authorId: text('author_id'),
  body: text('body').notNull(),
  createdAt: created(),
}, (t) => [index('chat_messages_chat').on(t.chatId, t.createdAt)]);

/** Fault and support tickets, with service-level turnaround targets by severity. */
export const tickets = pgTable('tickets', {
  id: id(),
  ref: text('ref').notNull().unique(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  severity: text('severity').$type<'P1' | 'P2' | 'P3' | 'P4'>().notNull(),
  category: text('category').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').$type<'open' | 'in_progress' | 'resolved'>().notNull().default('open'),
  respondBy: ts('respond_by').notNull(),
  resolveBy: ts('resolve_by').notNull(),
  firstResponseAt: ts('first_response_at'),
  resolvedAt: ts('resolved_at'),
  resolution: text('resolution'),
  createdAt: created(),
});

export const apiKeys = pgTable('api_keys', {
  id: id(),
  spaceId: text('space_id').references(() => spaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  createdById: text('created_by').references(() => users.id),
  lastUsedAt: ts('last_used_at'),
  revokedAt: ts('revoked_at'),
  createdAt: created(),
});

export const privacyRequests = pgTable('privacy_requests', {
  id: id(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  kind: text('kind').$type<'export' | 'erase' | 'correct'>().notNull(),
  note: text('note').notNull().default(''),
  status: text('status').$type<'open' | 'done' | 'refused'>().notNull().default('open'),
  dueAt: ts('due_at').notNull(),
  resolvedAt: ts('resolved_at'),
  createdAt: created(),
});

/** Key-value settings, e.g. the look (colours, font) and live-chat hours. */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});
