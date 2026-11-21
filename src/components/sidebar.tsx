'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, LogOut, Home, FileText, Trophy, Scale, Filter, Gavel, List, MessageCircle, LifeBuoy, BarChart3, Layers, FileStack, Users, ShieldCheck, Lock, Palette, User, Menu, X, MessagesSquare, Globe } from 'lucide-react';
import type { NavItem } from '@/lib/nav';
import { Logo } from './logo';
import { logout } from '@/app/actions/auth';

const ICONS = { home: Home, file: FileText, trophy: Trophy, scale: Scale, filter: Filter, gavel: Gavel, list: List, chat: MessageCircle, lifebuoy: LifeBuoy, chart: BarChart3, layers: Layers, pages: FileStack, users: Users, shield: ShieldCheck, lock: Lock, palette: Palette, user: User, forum: MessagesSquare } as const;

export function Sidebar({ items, badges, user }: { items: NavItem[]; badges: Record<string, number>; user: { name: string; email: string; role: string } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const groups = [...new Set(items.map((i) => i.group))];
  const nav = (
    <nav aria-label="Workspace" className="space-y-1">
      <Link href="/how-it-works" className="mb-4 flex items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-3 py-2.5 text-xs font-bold text-amber hover:bg-amber/20"><Sparkles size={14} /> The journey, step by step <span className="ml-auto">→</span></Link>
      {groups.map((g, n) => (
        <div key={g} className={n ? 'border-t border-white/10 pt-1' : ''}>
          {items.filter((i) => i.group === g).map((i) => {
            const I = ICONS[i.icon as keyof typeof ICONS] ?? Home;
            const active = i.href === '/dashboard' ? path === '/dashboard' : path.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`my-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${active ? 'bg-gradient-to-r from-[var(--t-brand)] to-[var(--t-bark)] text-white shadow-[0_8px_24px_-10px_var(--t-glow)]' : 'text-white/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white'}`}>
                <I size={18} />{i.label}
                {badges[i.href] ? <span className={`ml-auto rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-white text-[var(--brand)]' : 'bg-[var(--brand)] text-white'}`}>{badges[i.href]}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
  const foot = (
    <div className="mt-6 border-t border-white/10 pt-4">
      <div className="px-2 text-sm font-semibold text-white">{user.name}</div>
      <div className="truncate px-2 text-[13px] text-white/70">{user.email}</div>
      <div className="px-2 text-[13px] text-amber">{user.role}</div>
      <Link href="/" className="mt-3 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[15px] text-white/85 hover:bg-white/10"><Globe size={18} /> Go to the public site</Link>
      <form action={logout}><button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[15px] text-white/85 hover:bg-white/10"><LogOut size={18} /> Sign out</button></form>
    </div>
  );
  return (
    <>
      <button className="fixed left-3 top-3 z-50 grid size-10 place-items-center rounded-xl bg-ink text-white lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r border-white/10 bg-ink bg-[radial-gradient(30rem_20rem_at_0%_0%,var(--t-aura-1),transparent_70%)] p-2 lg:flex">
        <Link href="/" className="mb-5 block px-2.5 pt-3"><Logo dark /></Link>{nav}<div className="mt-auto">{foot}</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/60 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 overflow-y-auto bg-ink p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between"><Logo dark /><button aria-label="Close menu" className="text-white" onClick={() => setOpen(false)}><X /></button></div>{nav}{foot}
          </aside>
        </div>
      )}
    </>
  );
}
