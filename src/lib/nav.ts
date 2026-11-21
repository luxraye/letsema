import type { Role } from '@/db/schema';
import { can, type Permission } from './rbac';

export type NavItem = { href: string; label: string; icon: string; perm?: Permission; roles?: Role[]; group: string };
export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: 'home', group: 'You' },
  { href: '/dashboard/entries', label: 'My applications', icon: 'file', perm: 'entry.create', group: 'You' },
  { href: '/instances', label: 'Find a competition', icon: 'trophy', perm: 'entry.create', group: 'You' },
  { href: '/dashboard/review', label: 'Scoring queue', icon: 'scale', perm: 'entry.review', group: 'Judging' },
  { href: '/dashboard/screening', label: 'Screening', icon: 'filter', perm: 'entry.screen', group: 'Judging' },
  { href: '/dashboard/panel', label: 'Panel decisions', icon: 'gavel', perm: 'entry.decide', group: 'Judging' },
  { href: '/dashboard/pipeline', label: 'All applications', icon: 'list', perm: 'entry.viewAll', group: 'Judging' },
  { href: '/dashboard/chat', label: 'Live chat', icon: 'chat', perm: 'chat.answer', group: 'Support' },
  { href: '/dashboard/support', label: 'Support tickets', icon: 'lifebuoy', perm: 'chat.answer', group: 'Support' },
  { href: '/dashboard/reports', label: 'Reports', icon: 'chart', perm: 'reports.view', group: 'Insight' },
  { href: '/dashboard/instances', label: 'Instance Studio', icon: 'layers', perm: 'instance.manage', group: 'Manage' },
  { href: '/dashboard/content', label: 'Content', icon: 'pages', perm: 'content.manage', group: 'Manage' },
  { href: '/dashboard/users', label: 'Users and roles', icon: 'users', perm: 'users.manage', group: 'Manage' },
  { href: '/dashboard/audit', label: 'Audit trail', icon: 'shield', perm: 'audit.view', group: 'Manage' },
  { href: '/dashboard/privacy', label: 'Data protection', icon: 'lock', perm: 'privacy.manage', group: 'Manage' },
  { href: '/dashboard/settings', label: 'Look and settings', icon: 'palette', perm: 'settings.manage', group: 'Manage' },
  { href: '/community', label: 'Community forum', icon: 'forum', group: 'Account' },
  { href: '/dashboard/profile', label: 'Profile and security', icon: 'user', group: 'Account' },
];
export const navFor = (role: Role) => NAV.filter((n) => (!n.perm || can(role, n.perm)) && (!n.roles || n.roles.includes(role)));
