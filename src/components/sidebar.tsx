'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, FileText, Trophy, Scale, Filter, Gavel, List, MessageCircle, LifeBuoy, BarChart3, Layers, FileStack, Users, ShieldCheck, Lock, Palette, User, Menu, X } from 'lucide-react';
import type { NavItem } from '@/lib/nav';
import { Logo } from './logo';

const ICONS = { home: Home, file: FileText, trophy: Trophy, scale: Scale, filter: Filter, gavel: Gavel, list: List, chat: MessageCircle, lifebuoy: LifeBuoy, chart: BarChart3, layers: Layers, pages: FileStack, users: Users, shield: ShieldCheck, lock: Lock, palette: Palette, user: User } as const;

export function Sidebar({ items, badges }: { items: NavItem[]; badges: Record<string, number> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const groups = [...new Set(items.map((i) => i.group))];
  const nav = (
    <nav aria-label="Workspace" className="space-y-5">
      {groups.map((g) => (
        <div key={g}>
          <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-white/40">{g}</div>
          {items.filter((i) => i.group === g).map((i) => {
            const I = ICONS[i.icon as keyof typeof ICONS] ?? Home;
            const active = i.href === '/dashboard' ? path === '/dashboard' : path.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${active ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
                <I size={17} className={active ? 'text-[var(--brand)]' : ''} />{i.label}
                {badges[i.href] ? <span className="ml-auto rounded-full bg-[var(--brand)] px-1.5 text-[11px] font-bold text-white">{badges[i.href]}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
  return (
    <>
      <button className="fixed left-3 top-3 z-50 grid size-10 place-items-center rounded-xl bg-ink text-white lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-y-auto bg-ink p-4 lg:block">
        <Link href="/" className="mb-6 block px-2 pt-1"><Logo dark /></Link>{nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/60 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 overflow-y-auto bg-ink p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between"><Logo dark /><button aria-label="Close menu" className="text-white" onClick={() => setOpen(false)}><X /></button></div>{nav}
          </aside>
        </div>
      )}
    </>
  );
}
