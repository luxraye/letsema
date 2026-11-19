import Link from 'next/link';
import { ChevronDown, Trophy, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from './logo';
import { A11yMenu } from './a11y';
import { currentUser } from '@/lib/session';
import { t } from '@/lib/i18n';
import { MobileNav } from './mobile-nav';

export const MENUS = [
  { label: 'Competitions', icon: Trophy, items: [
    { href: '/instances', title: 'Open competitions', text: 'Calls, hackathons and accelerators you can enter now' },
    { href: '/eligibility', title: 'Am I eligible?', text: 'A 30-second check before you start' },
    { href: '/funded', title: 'Funded innovators', text: 'Ideas CEDA has backed, and what they are building' },
    { href: '/spaces/bdih', title: 'Partner spaces', text: 'BDIH and BTC run their challenges here too' },
  ] },
  { label: 'How it works', icon: BookOpen, items: [
    { href: '/how-it-works', title: 'The journey', text: 'Every step from idea to funded business' },
    { href: '/help', title: 'Help and FAQs', text: 'Answers, regulators, support and turnaround times' },
    { href: '/community', title: 'Community', text: 'Ask other innovators, find a co-founder' },
  ] },
  { label: 'Trust', icon: ShieldCheck, items: [
    { href: '/track', title: 'Track an application', text: 'Follow any reference, get free alerts' },
    { href: '/verify', title: 'Verify an award', text: 'Check a certificate or receipt is real' },
    { href: '/status', title: 'Status and hosting', text: 'Live speed, uptime, where data lives, what it costs' },
    { href: '/privacy', title: 'Privacy', text: 'Your rights under the Data Protection Act 2024' },
  ] },
];

export async function SiteHeader() {
  const me = await currentUser();
  const tr = await t();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" aria-label="CEDA Innovation Portal home"><Logo dark /></Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {MENUS.map((m) => (
            <div key={m.label} className="group relative">
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 group-focus-within:bg-white/10"><m.icon size={15} />{tr(m.label)}<ChevronDown size={14} className="opacity-60" /></button>
              <div className="invisible absolute left-0 top-full w-[22rem] translate-y-1 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-2xl border border-line bg-white p-2 text-ink shadow-2xl">
                  {m.items.map((i) => <Link key={i.href} href={i.href} className="block rounded-xl px-3 py-2.5 hover:bg-sand"><div className="text-sm font-semibold">{i.title}</div><div className="text-xs text-muted">{i.text}</div></Link>)}
                </div>
              </div>
            </div>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/judges" className="hidden items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-bold text-amber sm:inline-flex"><Sparkles size={13} /> {tr('For judges')}</Link>
          <A11yMenu dark />
          {me ? <Link href="/dashboard" className="btn-primary !py-2">{tr('Dashboard')}</Link> : <Link href="/login" className="btn-primary !py-2">{tr('Sign in')}</Link>}
          <MobileNav menus={MENUS.map((m) => ({ label: tr(m.label), items: m.items }))} />
        </div>
      </div>
    </header>
  );
}
