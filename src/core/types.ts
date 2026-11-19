// Domain model for Letsema. Everything the UI shows is derived from these types,
// and every change goes through src/core/actions.ts so it is permission-checked
// and written to the audit chain.

export type Role = string; // built-in: innovator | reviewer | adjudicator | observer | consultant | admin, plus any custom role

export type Permission =
  | 'idea.create'
  | 'idea.view.own'
  | 'idea.view.pipeline'
  | 'idea.view.identity'
  | 'idea.screen'
  | 'review.submit'
  | 'idea.decide'
  | 'idea.award'
  | 'campaign.manage'
  | 'content.manage'
  | 'users.manage'
  | 'audit.view'
  | 'reports.view'
  | 'chat.answer'
  | 'settings.manage'
  | 'privacy.manage';

export interface RoleDef {
  key: Role;
  label: string;
  description: string;
  permissions: Permission[];
  builtIn: boolean;
  internal: boolean; // CEDA-side (internal) vs external stakeholder
}

export interface AlertPrefs {
  inapp: boolean;
  email: boolean;
  sms: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  org?: string;
  district?: string;
  title?: string;
  staff?: boolean;
  verified: boolean;
  passwordHash: string;
  passkeys: { id: string; label: string; createdAt: string }[];
  createdAt: string;
  consentAt?: string;
  alerts: AlertPrefs;
  disabled?: boolean;
  expertise?: string[];
}

export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'url';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  help?: string;
  options?: string[];
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number; // relative weight; normalised when scoring
}

export interface RequiredDoc {
  id: string;
  name: string;
  required: boolean;
  accept: string; // e.g. ".pdf,.docx"
  maxMb: number;
}

export type CampaignStatus = 'draft' | 'open' | 'reviewing' | 'closed';
export type Track = 'public' | 'staff' | 'partner';

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  track: Track;
  host: string; // CEDA, or partner e.g. Botswana Innovation Hub
  summary: string;
  brief: string;
  themes: string[];
  opens: string;
  closes: string;
  status: CampaignStatus;
  awardPool: number; // Pula
  maxAward: number;
  eligibility: string[];
  criteria: Criterion[];
  form: FormField[];
  documents: RequiredDoc[];
  levels: {
    screening: boolean;
    reviewersPerIdea: number;
    disagreementThreshold: number; // points out of 100
    committeeQuorum: number;
  };
  hue: number;
  createdAt: string;
  updatedAt: string;
}

export type Status =
  | 'draft'
  | 'submitted'
  | 'screening'
  | 'in_review'
  | 'revision'
  | 'committee'
  | 'approved'
  | 'awarded'
  | 'development'
  | 'declined'
  | 'withdrawn';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  sha256: string;
  docId?: string;
}

export interface IdeaVersion {
  n: number;
  at: string;
  title: string;
  summary: string;
  answers: Record<string, string>;
  note: string; // what changed (innovator's note on resubmission)
}

export interface Assignment {
  reviewerId: string;
  assignedAt: string;
  dueAt: string;
  conflict?: { declared: boolean; note?: string; at: string };
}

export interface Review {
  id: string;
  reviewerId: string;
  round: number;
  scores: Record<string, number>; // criterionId -> 1..5
  comments: Record<string, string>;
  overall: string;
  recommendation: 'advance' | 'revise' | 'decline';
  submittedAt: string;
}

export interface Message {
  id: string;
  authorId: string;
  body: string;
  at: string;
  visibility: 'shared' | 'internal';
  kind?: 'feedback' | 'reply' | 'note' | 'system';
}

export interface Milestone {
  id: string;
  title: string;
  due: string;
  tranche: number;
  status: 'planned' | 'in_progress' | 'evidence' | 'verified';
  evidence?: string;
}

export interface HistoryItem {
  at: string;
  status: Status;
  by: string;
  note?: string;
}

export interface Idea {
  id: string;
  ref: string;
  campaignId: string;
  ownerId: string;
  team: string[]; // names of co-founders / co-authors
  title: string;
  summary: string;
  sector: string;
  district: string;
  answers: Record<string, string>;
  attachments: Attachment[];
  status: Status;
  round: number;
  versions: IdeaVersion[];
  assignments: Assignment[];
  reviews: Review[];
  thread: Message[];
  screening?: { by: string; at: string; passed: boolean; checks: Record<string, boolean>; note?: string };
  decision?: { by: string; at: string; outcome: 'approve' | 'revise' | 'decline'; rationale: string; votes: Record<string, 'approve' | 'revise' | 'decline'> };
  award?: { amount: number; at: string; code: string };
  milestones: Milestone[];
  history: HistoryItem[];
  watchers: { contact: string; channel: 'email' | 'sms'; at: string }[];
  showcase: boolean; // listed in the public idea bank
  cheers: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  at: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
}

export interface OutboxItem {
  id: string;
  to: string;
  channel: 'email' | 'sms';
  subject: string;
  body: string;
  at: string;
}

export interface AuditEntry {
  seq: number;
  at: string;
  actorId: string;
  actorRole: string;
  action: string;
  target: string;
  detail: string;
  prevHash: string;
  hash: string;
}

export interface ChatMessage {
  from: 'visitor' | 'agent' | 'system';
  agentId?: string;
  body: string;
  at: string;
}

export interface Conversation {
  id: string;
  visitorName: string;
  visitorId?: string;
  topic: string;
  status: 'waiting' | 'active' | 'closed' | 'missed';
  agentId?: string;
  startedAt: string;
  firstResponseAt?: string;
  closedAt?: string;
  rating?: number;
  messages: ChatMessage[];
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  q: string;
  a: string;
  category: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  sha256: string;
  campaignId?: string;
  purpose: string;
  uploadedAt: string;
  dataUrl?: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  tone: 'info' | 'success' | 'warning';
  active: boolean;
  at: string;
}

export interface Theme {
  preset: string;
  primary: string;
  accent: string;
  ink: string;
  paper: string;
  font: string;
  radius: number;
}

export interface Settings {
  theme: Theme;
  chat: { open: string; close: string; days: number[]; maxPerAgent: number };
  retentionMonths: { applications: number; chat: number; audit: number; declined: number };
  roles: RoleDef[];
  webhooks: { id: string; url: string; events: string[]; active: boolean }[];
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  kind: 'export' | 'erase' | 'correct';
  at: string;
  status: 'open' | 'done';
  note?: string;
}

export interface State {
  schema: number;
  seededAt: string;
  users: User[];
  campaigns: Campaign[];
  ideas: Idea[];
  notifications: Notification[];
  outbox: OutboxItem[];
  audit: AuditEntry[];
  conversations: Conversation[];
  pages: Page[];
  faqs: Faq[];
  documents: DocumentFile[];
  notices: Notice[];
  settings: Settings;
  privacy: PrivacyRequest[];
  otps: { to: string; code: string; purpose: string; expires: string }[];
}
