import type { Permission, RoleDef, State, User } from './types';

export const PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'idea.create', label: 'Submit and edit own ideas', group: 'Ideas' },
  { key: 'idea.view.own', label: 'See own ideas, feedback and scores', group: 'Ideas' },
  { key: 'idea.view.pipeline', label: 'See every idea in the pipeline', group: 'Ideas' },
  { key: 'idea.view.identity', label: 'See who submitted (un-blinded)', group: 'Ideas' },
  { key: 'idea.screen', label: 'Screen ideas for completeness', group: 'Evaluation' },
  { key: 'review.submit', label: 'Score assigned ideas', group: 'Evaluation' },
  { key: 'idea.decide', label: 'Vote and decide at committee', group: 'Evaluation' },
  { key: 'idea.award', label: 'Confirm awards and milestones', group: 'Evaluation' },
  { key: 'campaign.manage', label: 'Create and edit calls, forms and criteria', group: 'Administration' },
  { key: 'content.manage', label: 'Upload, edit and delete content', group: 'Administration' },
  { key: 'users.manage', label: 'Manage users and roles', group: 'Administration' },
  { key: 'settings.manage', label: 'Change look, chat hours and integrations', group: 'Administration' },
  { key: 'audit.view', label: 'Read the audit trail', group: 'Oversight' },
  { key: 'reports.view', label: 'Read reports and dashboards', group: 'Oversight' },
  { key: 'privacy.manage', label: 'Handle data-protection requests', group: 'Oversight' },
  { key: 'chat.answer', label: 'Answer live chat', group: 'Service' },
];

export const DEFAULT_ROLES: RoleDef[] = [
  {
    key: 'innovator', label: 'Innovator', builtIn: true, internal: false,
    description: 'Submits ideas, answers feedback, resubmits and tracks progress.',
    permissions: ['idea.create', 'idea.view.own'],
  },
  {
    key: 'reviewer', label: 'Reviewer', builtIn: true, internal: true,
    description: 'Scores assigned ideas against the criteria. Sees ideas blind (no names).',
    permissions: ['review.submit'],
  },
  {
    key: 'adjudicator', label: 'Committee member', builtIn: true, internal: true,
    description: 'Sees all scores, votes at committee and approves awards.',
    permissions: ['idea.view.pipeline', 'idea.view.identity', 'idea.decide', 'idea.award', 'reports.view'],
  },
  {
    key: 'observer', label: 'Committee observer', builtIn: true, internal: false,
    description: 'External committee stakeholder. Watches progress and reports; cannot change anything.',
    permissions: ['idea.view.pipeline', 'reports.view'],
  },
  {
    key: 'consultant', label: 'CEDA consultant', builtIn: true, internal: true,
    description: 'Answers live chat and helps applicants complete submissions.',
    permissions: ['chat.answer', 'reports.view'],
  },
  {
    key: 'admin', label: 'Administrator', builtIn: true, internal: true,
    description: 'Runs calls, content, users, settings, privacy and audit.',
    permissions: PERMISSIONS.map((p) => p.key),
  },
];

export function roleDef(state: State, role: string): RoleDef | undefined {
  return state.settings.roles.find((r) => r.key === role);
}

export function can(state: State, user: User | undefined | null, perm: Permission): boolean {
  if (!user || user.disabled) return false;
  return !!roleDef(state, user.role)?.permissions.includes(perm);
}

export class Forbidden extends Error {
  constructor(perm: string) {
    super(`You don't have permission to do this (${perm}).`);
  }
}

export function assertCan(state: State, user: User | undefined | null, perm: Permission) {
  if (!can(state, user, perm)) throw new Forbidden(perm);
}
