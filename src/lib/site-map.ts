import { Trophy, Sparkles, BookOpen, Handshake, ClipboardCheck, Search, Gauge, BadgeCheck, MessagesSquare, HelpCircle, Map, ShieldCheck, Lock, Building2, Radio, Scale } from 'lucide-react';

/** The public site map: header menus, mobile menu and site search all use it. */
export const MENUS = [
  { label: 'Compete', icon: Trophy, items: [
    { href: '/instances', title: 'Open competitions', text: 'Calls, hackathons and accelerators you can enter now', icon: Trophy },
    { href: '/eligibility', title: 'Which can I enter?', text: 'Each competition has its own rules; check them all at once', icon: ClipboardCheck },
    { href: '/track', title: 'Track an application', text: 'Follow any reference, get free alerts', icon: Search },
  ] },
  { label: 'Showcase', icon: Sparkles, items: [
    { href: '/funded', title: 'Funded innovators', text: 'Ideas CEDA has backed, and what they are building', icon: Sparkles },
    { href: '/verify', title: 'Verify an award', text: 'Check a certificate or receipt is real', icon: BadgeCheck },
    { href: '/community', title: 'Community', text: 'Ask other innovators, find a co-founder', icon: MessagesSquare },
  ] },
  { label: 'Learn', icon: BookOpen, items: [
    { href: '/how-it-works', title: 'How it works', text: 'Every step from idea to funded business', icon: Map },
    { href: '/judges', title: 'How to judge this portal', text: 'Each scoring criterion, one click away', icon: Scale },
    { href: '/help', title: 'Help and FAQs', text: 'Answers, regulators, support and turnaround times', icon: HelpCircle },
    { href: '/status', title: 'Status and hosting', text: 'Live speed, uptime and where data lives', icon: Gauge },
    { href: '/privacy', title: 'Privacy', text: 'Your rights under the Data Protection Act 2024', icon: Lock },
  ] },
  { label: 'Partners', icon: Handshake, items: [
    { href: '/spaces/ceda', title: 'CEDA', text: 'CEDA’s own calls and challenges', icon: ShieldCheck },
    { href: '/spaces/bdih', title: 'BDIH', text: 'Botswana Digital & Innovation Hub (demo partner space)', icon: Building2 },
    { href: '/spaces/btc', title: 'BTC', text: 'Demo partner space for connectivity, 5G and IoT', icon: Radio },
  ] },
];

export const PAGES = MENUS.flatMap((m) => m.items.map((i) => ({ ...i, group: m.label })));

/** Pages that are not in the menus but people still look for. */
export const EXTRA_PAGES = [
  { href: '/dial', title: 'No data? Dial *161#', text: 'Track an application from any phone, no data needed', group: 'Help' },
  { href: '/register', title: 'Create an account', text: 'Free, takes a minute', group: 'Compete' },
  { href: '/login', title: 'Sign in', text: 'Password, one-time code or fingerprint', group: 'Account' },
  { href: '/help#support', title: 'Report a problem', text: 'Open a support ticket with a response deadline', group: 'Help' },
  { href: '/alerts', title: 'Free alerts', text: 'Email or SMS each time an application moves', group: 'Compete' },
  { href: '/demo-inbox', title: 'Demo inbox', text: 'Where demo emails and SMS land', group: 'Help' },
];
