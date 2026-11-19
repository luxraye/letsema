import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { STATUS } from '@/lib/format';

const TONES: Record<string, string> = {
  gray: 'bg-stone-100 text-stone-700', blue: 'bg-sky-100 text-sky-800', amber: 'bg-amber-100 text-amber-900',
  orange: 'bg-orange-100 text-orange-800', violet: 'bg-violet-100 text-violet-800', green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-rose-100 text-rose-800', brand: 'bg-[var(--brand)]/10 text-[var(--brand)]', dark: 'bg-bark text-white',
};
export function Badge({ tone = 'gray', children, title }: { tone?: string; children: ReactNode; title?: string }) {
  return <span title={title} className={`chip ${TONES[tone] ?? TONES.gray}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: 'gray', plain: '' };
  return <Badge tone={s.tone} title={s.plain}>{s.label}</Badge>;
}
export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-[2.6rem] sm:leading-tight">{title}</h1>
        {sub && <p className="mt-2 text-base text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}
const STAT_TONES: Record<string, string> = { amber: 'bg-amber-100 text-amber-700', orange: 'bg-orange-100 text-orange-700', violet: 'bg-violet-100 text-violet-700', red: 'bg-rose-100 text-rose-700', green: 'bg-emerald-100 text-emerald-700', blue: 'bg-sky-100 text-sky-700' };
export function Stat({ label, value, hint, icon: Icon, tone = 'orange' }: { label: string; value: ReactNode; hint?: string; icon?: ComponentType<{ size?: number }>; tone?: string }) {
  return (
    <div className="card p-4" title={hint}>
      {Icon && <div className={`mb-3 grid size-9 place-items-center rounded-lg ${STAT_TONES[tone] ?? STAT_TONES.orange}`}><Icon size={18} /></div>}
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="mt-0.5 text-[15px] text-muted">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-muted/80">{hint}</div>}
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line p-8 text-center"><div className="font-semibold">{title}</div>{children && <div className="mt-1 text-sm text-muted">{children}</div>}</div>;
}
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.replace(/^(Dr|Prof\.?)\s+/, '').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return <span aria-hidden className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 45% 42%)` }}>{initials}</span>;
}
export function Tabs({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-sand p-1">
      {items.map((t) => <Link key={t.key} role="tab" aria-selected={t.key === active} href={t.href} className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold ${t.key === active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{t.label}</Link>)}
    </div>
  );
}
export function Notice({ tone = 'amber', children }: { tone?: 'amber' | 'green' | 'red' | 'blue'; children: ReactNode }) {
  const c = { amber: 'border-amber-200 bg-amber-50 text-amber-950', green: 'border-emerald-200 bg-emerald-50 text-emerald-950', red: 'border-rose-200 bg-rose-50 text-rose-950', blue: 'border-sky-200 bg-sky-50 text-sky-950' }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}
export function Bars({ data, max }: { data: { label: string; value: number; hint?: string }[]; max?: number }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted" title={d.label}>{d.label}</span>
          <span className="h-6 overflow-hidden rounded-md bg-sand"><span className="flex h-full min-w-6 items-center rounded-md bg-[var(--brand)] px-2 text-[11px] font-semibold text-white" style={{ width: `${(d.value / m) * 100}%` }}>{d.value}</span></span>
          <span className="w-14 text-right text-xs font-semibold tabular-nums text-muted">{d.hint ?? ''}</span>
        </div>
      ))}
    </div>
  );
}
export function StageTrack({ stages, current }: { stages: { key: string; label: string; starts?: string; ends?: string }[]; current: number }) {
  return (
    <ol className="grid gap-2 sm:grid-flow-col sm:auto-cols-fr">
      {stages.map((s, i) => (
        <li key={s.key} className={`rounded-xl border p-3 text-sm ${i === current ? 'border-[var(--brand)] bg-[var(--brand)]/5' : i < current ? 'border-line bg-sand/60' : 'border-line'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Step {i + 1}{i === current && <span className="ml-1 rounded bg-[var(--brand)] px-1.5 py-0.5 text-white">Now</span>}</div>
          <div className="font-semibold">{s.label}</div>
          {s.starts && <div className="text-xs text-muted">{s.starts === s.ends ? s.starts : `${s.starts} → ${s.ends}`}</div>}
        </li>
      ))}
    </ol>
  );
}
export function Info({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <details className="group inline-block align-middle">
      <summary className={`inline-grid size-5 cursor-pointer list-none place-items-center rounded-full border text-[11px] font-bold ${dark ? 'border-white/40 text-white/70 hover:text-white' : 'border-line text-muted hover:text-ink'}`} aria-label="What is this?">i</summary>
      <div className="absolute right-0 z-30 mt-2 w-60 max-w-xs rounded-xl border border-line bg-white p-3 text-xs font-normal normal-case tracking-normal text-ink shadow-lg">{children}</div>
    </details>
  );
}
