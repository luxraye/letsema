'use client';
import { useEffect, useState } from 'react';
import { Accessibility } from 'lucide-react';

const KEY = 'ceda:a11y';
type Prefs = { large: boolean; contrast: boolean; lang: 'en' | 'tn' };

/** Apply saved accessibility choices before paint, to avoid a flash. */
export function A11yBoot() {
  const js = `try{var p=JSON.parse(localStorage.getItem('${KEY}')||'{}');var c=document.documentElement.classList;if(p.large)c.add('large-text');if(p.contrast)c.add('high-contrast');if(p.lang)document.documentElement.lang=p.lang==='tn'?'tn':'en'}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

function read(): Prefs { try { return { large: false, contrast: false, lang: 'en', ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { large: false, contrast: false, lang: 'en' }; } }

export function A11yMenu({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Prefs>({ large: false, contrast: false, lang: 'en' });
  useEffect(() => setP(read()), []);
  const save = (n: Prefs) => {
    setP(n);
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {}
    const c = document.documentElement.classList;
    c.toggle('large-text', n.large); c.toggle('high-contrast', n.contrast);
    if (n.lang !== p.lang) { document.cookie = `lang=${n.lang};path=/;max-age=31536000`; location.reload(); }
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Accessibility and language" className={`grid size-9 place-items-center rounded-lg ${dark ? 'text-white/80 hover:bg-white/10' : 'text-muted hover:bg-sand'}`}><Accessibility size={18} /></button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-line bg-white p-4 text-sm text-ink shadow-xl">
          <div className="mb-2 font-bold">Make it easier to use</div>
          <label className="flex items-center justify-between py-1.5">Larger text <input type="checkbox" checked={p.large} onChange={(e) => save({ ...p, large: e.target.checked })} /></label>
          <label className="flex items-center justify-between py-1.5">High contrast <input type="checkbox" checked={p.contrast} onChange={(e) => save({ ...p, contrast: e.target.checked })} /></label>
          <div className="mt-2 font-bold">Language</div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {(['en', 'tn'] as const).map((l) => <button key={l} onClick={() => save({ ...p, lang: l })} className={`rounded-lg border px-2 py-1.5 ${p.lang === l ? 'border-[var(--brand)] bg-[var(--brand)]/5 font-semibold' : 'border-line'}`}>{l === 'en' ? 'English' : 'Setswana'}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}
