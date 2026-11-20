'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, X } from 'lucide-react';

type Hit = { href: string; title: string; text: string; group: string };

const START: Hit[] = [
  { href: '/instances', title: 'Open competitions', text: 'Calls, hackathons and accelerators you can enter now', group: 'Popular' },
  { href: '/eligibility', title: 'Am I eligible?', text: 'A 30-second check before you start', group: 'Popular' },
  { href: '/track', title: 'Track an application', text: 'Follow any reference, get free alerts', group: 'Popular' },
  { href: '/judges', title: 'How to judge this portal', text: 'Each scoring criterion, one click away', group: 'Popular' },
  { href: '/dial', title: 'No data? Dial *161#', text: 'Check your application from any phone', group: 'Popular' },
];

/** Header search: press ⌘K or Ctrl+K anywhere, type, pick with the arrow keys. */
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>(START);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (!open) { setQ(''); setHits(START); setSel(0); } }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setHits(START); setSel(0); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal }).then((r) => r.json()).then((d: { hits: Hit[] }) => { setHits(d.hits); setSel(0); }).catch(() => {});
    }, 150);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const go = (h?: Hit) => { if (!h) return; setOpen(false); router.push(h.href); };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/5 py-1.5 pl-3 pr-1.5 text-xs text-white/75 transition hover:bg-white/10 hover:text-white md:flex" aria-label="Search the portal">
        <Search size={14} /> Search <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[10px] text-white/60">⌘K</kbd>
      </button>
      <button type="button" onClick={() => setOpen(true)} className="grid size-8 place-items-center rounded-full text-white/80 hover:bg-white/10 md:hidden" aria-label="Search the portal"><Search size={17} /></button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/60 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-xl overflow-hidden rounded-2xl bg-surface text-fg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="text-muted" />
              <input ref={input} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search competitions, help, funded ideas, or a reference like CEDA-26-0101"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                  if (e.key === 'Enter') { e.preventDefault(); go(hits[sel]); }
                }}
                className="h-14 flex-1 bg-transparent text-sm !outline-none" aria-label="Search" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-sand"><X size={16} /></button>
            </div>
            <ul className="max-h-[55vh] overflow-y-auto p-2">
              {hits.length === 0 && <li className="p-6 text-center text-sm text-muted">Nothing found for “{q}”. Try a sector, a competition name or a reference.</li>}
              {hits.map((h, i) => (
                <li key={`${h.href}-${i}`}>
                  <button type="button" onMouseEnter={() => setSel(i)} onClick={() => go(h)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === sel ? 'bg-sand' : ''}`}>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{h.title}</span><span className="block truncate text-xs text-muted">{h.text}</span></span>
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">{h.group}</span>
                    {i === sel && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-2 text-[11px] text-muted">↑ ↓ to move · Enter to open · Esc to close</div>
          </div>
        </div>
      )}
    </>
  );
}
