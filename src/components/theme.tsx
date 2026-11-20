'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { LOOK_COOKIE, type Look } from '@/lib/look';

/**
 * One tap flips the whole portal between Burgundy (default) and Azure.
 * The choice is kept in a cookie so the server paints the right look first, with no flash.
 * Where the browser supports it, the new look spreads out in a circle from the button.
 */
export function ThemeToggle({ initial, dark = true, className = '' }: { initial: Look; dark?: boolean; className?: string }) {
  const [look, setLook] = useState<Look>(initial);
  useEffect(() => { const v = document.documentElement.dataset.theme; if (v === 'azure' || v === 'burgundy') setLook(v); }, []);
  const next: Look = look === 'azure' ? 'burgundy' : 'azure';
  const apply = (l: Look) => {
    document.documentElement.dataset.theme = l;
    document.cookie = `${LOOK_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', l === 'azure' ? '#05295c' : '#150510');
    setLook(l);
  };
  const flip = (e: React.MouseEvent<HTMLButtonElement>) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || reduce) {
      const html = document.documentElement;
      if (!reduce) { html.classList.add('theme-fade'); setTimeout(() => html.classList.remove('theme-fade'), 400); }
      apply(next); return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = doc.startViewTransition(() => apply(next));
    t.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  };
  const label = next === 'azure' ? 'Switch to the light Azure look' : 'Switch to the Burgundy look';
  return (
    <button type="button" onClick={flip} aria-label={label} title={label}
      className={`group relative grid size-9 place-items-center overflow-hidden rounded-full transition ${dark ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-muted hover:bg-sand hover:text-fg'} ${className}`}>
      <Sun size={18} className={`absolute transition duration-500 ${look === 'azure' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
      <Moon size={17} className={`absolute transition duration-500 ${look === 'azure' ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

/** Cursor spotlight on cards: one listener for the whole page, skipped on touch screens. */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let raf = 0;
    const on = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('.card,[data-spot]') as HTMLElement | null;
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`); });
    };
    document.addEventListener('pointermove', on, { passive: true });
    return () => document.removeEventListener('pointermove', on);
  }, []);
  return null;
}
