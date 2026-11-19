import type { Role } from '@/db/schema';

export const ROLE_LABEL: Record<Role, string> = {
  innovator: 'Innovator',
  evaluator: 'Evaluator',
  panel: 'Adjudication panel',
  observer: 'Committee observer',
  consultant: 'CEDA consultant',
  partner_admin: 'Partner admin',
  admin: 'CEDA administrator',
  superadmin: 'Super administrator',
};

export const PERMISSIONS = {
  'entry.create': 'Start and submit applications',
  'entry.review': 'Score assigned applications (blind)',
  'entry.screen': 'Screen applications and assign evaluators',
  'entry.decide': 'Vote on and award shortlisted applications',
  'entry.viewAll': 'See every application and its scores',
  'instance.manage': 'Create and change Instances (challenges and calls)',
  'content.manage': 'Edit pages, FAQs, notices and documents',
  'chat.answer': 'Answer live chat and support tickets',
  'reports.view': 'See reporting dashboards',
  'users.manage': 'Add users and change roles',
  'audit.view': 'Read and verify the audit trail',
  'privacy.manage': 'Handle data protection requests',
  'settings.manage': 'Change the look, chat hours and integrations',
} as const;
export type Permission = keyof typeof PERMISSIONS;

export const GRANTS: Record<Role, Permission[]> = {
  innovator: ['entry.create'],
  evaluator: ['entry.review'],
  panel: ['entry.decide', 'entry.viewAll', 'reports.view'],
  observer: ['entry.viewAll', 'reports.view'],
  consultant: ['chat.answer', 'reports.view'],
  partner_admin: ['instance.manage', 'entry.screen', 'entry.viewAll', 'reports.view'],
  admin: ['instance.manage', 'entry.screen', 'entry.viewAll', 'content.manage', 'chat.answer', 'reports.view', 'users.manage', 'audit.view', 'privacy.manage'],
  superadmin: Object.keys(PERMISSIONS) as Permission[],
};

export const can = (role: Role | undefined | null, p: Permission) => !!role && GRANTS[role].includes(p);
export const isStaff = (role: Role) => role !== 'innovator';
