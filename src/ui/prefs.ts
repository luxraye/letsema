// Per-viewer accessibility preferences (kept on this device only).
export interface Prefs { scale: number; contrast: boolean; dyslexia: boolean; dark: boolean; lang: 'en' | 'tn' }
const KEY = 'letsema:prefs';
export function loadPrefs(): Prefs {
  try { return { scale: 1, contrast: false, dyslexia: false, dark: false, lang: 'en', ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return { scale: 1, contrast: false, dyslexia: false, dark: false, lang: 'en' }; }
}
export function applyPrefs(p: Prefs) {
  const r = document.documentElement;
  r.style.setProperty('--text-scale', String(p.scale));
  r.dataset.contrast = p.contrast ? 'high' : '';
  r.dataset.dyslexia = String(p.dyslexia);
  r.dataset.dark = String(p.dark);
  r.lang = p.lang === 'tn' ? 'tn' : 'en';
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
