'use client';
import { useActionState, useState } from 'react';
import { saveTheme, createApiKey, type AState } from '@/app/actions/admin';
import { FormMessage, Submit } from '@/components/forms';
import type { Theme } from '@/lib/settings';

export function ThemeForm({ theme, presets, fonts }: { theme: Theme; presets: Record<string, Theme>; fonts: string[] }) {
  const [s, action] = useActionState<AState, FormData>(saveTheme, undefined);
  const [t, setT] = useState(theme);
  const [custom, setCustom] = useState(theme.preset === 'custom');
  return (
    <form action={action} className="card grid gap-6 p-5 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <fieldset><legend className="label">Preset</legend><div className="grid gap-2 sm:grid-cols-3">{Object.entries(presets).map(([k, p]) => <label key={k} className="cursor-pointer rounded-xl border border-line p-3 text-sm capitalize has-[:checked]:border-ink"><input type="radio" name="preset" value={k} className="sr-only" defaultChecked={theme.preset === k} onChange={() => { setT(p); setCustom(false); }} /><span className="mb-2 flex gap-1"><span className="size-5 rounded" style={{ background: p.primary }} /><span className="size-5 rounded" style={{ background: p.accent }} /></span>{k === 'ceda' ? 'CEDA sunrise' : k.replace('-', ' ')}<span className="block text-xs text-muted">{p.font}</span></label>)}</div></fieldset>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="custom" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> Set my own colours and font</label>
        {custom && <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm"><span className="label">Main colour</span><input type="color" name="primary" value={t.primary} onChange={(e) => setT({ ...t, primary: e.target.value })} className="h-10 w-full rounded-lg" /></label>
          <label className="text-sm"><span className="label">Accent colour</span><input type="color" name="accent" value={t.accent} onChange={(e) => setT({ ...t, accent: e.target.value })} className="h-10 w-full rounded-lg" /></label>
          <label className="text-sm"><span className="label">Font</span><select name="font" className="field" value={t.font} onChange={(e) => setT({ ...t, font: e.target.value })}>{fonts.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label className="text-sm"><span className="label">Corner roundness: {t.radius}px</span><input type="range" name="radius" min={0} max={28} value={t.radius} onChange={(e) => setT({ ...t, radius: Number(e.target.value) })} className="w-full" /></label>
        </div>}
        <FormMessage state={s} /><Submit className="btn-primary">Apply to the whole portal</Submit>
      </div>
      <div className="rounded-2xl border border-line p-4" style={{ fontFamily: `'${t.font}', sans-serif` }} aria-label="Preview">
        <div className="text-xs font-bold uppercase text-muted">Preview</div>
        <div className="mt-2 border p-4" style={{ borderRadius: t.radius }}><div className="text-lg font-bold">Green Economy Fund</div><p className="text-sm text-muted">Clean energy, water and climate-smart farming.</p><div className="mt-3 flex gap-2"><span className="px-3 py-1.5 text-sm font-semibold text-white" style={{ background: t.primary, borderRadius: t.radius / 2 }}>Apply now</span><span className="px-3 py-1.5 text-sm font-semibold" style={{ background: `${t.accent}33`, borderRadius: t.radius / 2 }}>Rules sealed</span></div></div>
      </div>
    </form>
  );
}
export function KeyForm() {
  const [s, action] = useActionState<AState, FormData>(createApiKey, undefined);
  return <form action={action} className="flex flex-wrap gap-2"><input name="name" className="field !w-64" placeholder="Key name, e.g. BDIH CRM" /><Submit className="btn-ghost">Create key</Submit><div className="w-full"><FormMessage state={s} /></div></form>;
}
