'use client';
import { Globe2 } from 'lucide-react';

/** One-tap English / Setswana switch for menus and key labels. */
export function LangToggle({ lang }: { lang: 'en' | 'tn' }) {
  const next = lang === 'en' ? 'tn' : 'en';
  return (
    <button
      onClick={() => {
        document.cookie = `lang=${next};path=/;max-age=31536000`;
        try { const k = 'ceda:a11y'; const p = JSON.parse(localStorage.getItem(k) || '{}'); localStorage.setItem(k, JSON.stringify({ ...p, lang: next })); } catch {}
        location.reload();
      }}
      className="flex items-center gap-1 font-medium transition-colors hover:text-white"
      aria-label="Switch between English and Setswana"
    >
      <Globe2 size={12} className="text-amber" />{lang === 'en' ? 'Setswana' : 'English'}
    </button>
  );
}
