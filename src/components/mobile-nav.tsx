'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function MobileNav({ menus }: { menus: { label: string; items: { href: string; title: string }[] }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="grid size-9 place-items-center rounded-lg hover:bg-white/10 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={20} /></button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/60 lg:hidden" onClick={() => setOpen(false)}>
          <div className="ml-auto h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 text-ink" onClick={(e) => e.stopPropagation()}>
            <button className="mb-4 ml-auto grid size-9 place-items-center rounded-lg hover:bg-sand" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button>
            {menus.map((m) => (
              <div key={m.label} className="mb-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{m.label}</div>
                {m.items.map((i) => <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 font-medium hover:bg-sand">{i.title}</Link>)}
              </div>
            ))}
            <Link href="/judges" onClick={() => setOpen(false)} className="btn-ghost w-full">For judges</Link>
          </div>
        </div>
      )}
    </>
  );
}
