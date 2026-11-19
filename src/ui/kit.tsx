import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router';
import { X, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { store } from '../core/store';
import type { Permission, State, Status } from '../core/types';
import { can } from '../core/rbac';
import { STAGES, STATUS_META, stageIndex } from '../core/workflow';
import { initials } from '../core/util';
import type { Idea } from '../core/types';

// ---------------------------------------------------------------- store hooks

export function useStore(): State {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store.state;
}

export function useMe() {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store.me;
}

export function useCan(perm: Permission) {
  const s = useStore();
  return can(s, store.me, perm);
}

// ---------------------------------------------------------------- toasts

type Toast = { id: number; tone: 'ok' | 'err' | 'info'; text: string };
let toastId = 0;
const toastListeners = new Set<(t: Toast[]) => void>();
let toasts: Toast[] = [];
export function toast(text: string, tone: Toast['tone'] = 'ok') {
  const t = { id: ++toastId, tone, text };
  toasts = [...toasts, t];
  toastListeners.forEach((l) => l(toasts));
  setTimeout(() => { toasts = toasts.filter((x) => x.id !== t.id); toastListeners.forEach((l) => l(toasts)); }, tone === 'err' ? 6500 : 4000);
}
/** Runs an action; shows a toast. Returns the result (or true for void actions) on success, undefined on failure. */
export function attempt<T>(fn: () => T, ok?: string): T | true | undefined {
  try {
    const r = fn();
    if (ok) toast(ok);
    return r === undefined ? true : r;
  } catch (e) {
    toast((e as Error).message, 'err');
    return undefined;
  }
}
export function Toaster() {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => { toastListeners.add(setList); return () => { toastListeners.delete(setList); }; }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[80] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`rise pointer-events-auto flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${t.tone === 'err' ? 'bg-rose-700 text-white' : t.tone === 'info' ? 'bg-ink text-paper' : 'bg-brand text-brand-ink'}`}>
          {t.tone === 'err' ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : t.tone === 'info' ? <Info size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- primitives

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'; size?: 'sm' | 'md' | 'lg' };
const btnCls = (variant: BtnProps['variant'] = 'primary', size: BtnProps['size'] = 'md') =>
  `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
    size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-4 py-2.5 text-sm'
  } ${
    variant === 'primary' ? 'bg-brand text-brand-ink hover:brightness-110 shadow-sm'
    : variant === 'accent' ? 'bg-accent text-ink hover:brightness-105 shadow-sm'
    : variant === 'danger' ? 'bg-rose-600 text-white hover:bg-rose-700'
    : variant === 'ghost' ? 'text-ink hover:bg-ink/5'
    : 'border border-line bg-card text-ink hover:border-ink/30'
  }`;

export function Button({ variant, size, className = '', ...p }: BtnProps) {
  return <button {...p} className={`${btnCls(variant, size)} ${className}`} />;
}

export function LinkButton({ to, variant, size, className = '', children }: { to: string; variant?: BtnProps['variant']; size?: BtnProps['size']; className?: string; children: ReactNode }) {
  return <Link to={to} className={`${btnCls(variant, size)} ${className}`}>{children}</Link>;
}

const TONES: Record<string, string> = {
  slate: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
  sky: 'bg-sky-500/15 text-sky-800',
  violet: 'bg-violet-500/15 text-violet-800',
  amber: 'bg-amber-500/20 text-amber-900',
  indigo: 'bg-indigo-500/15 text-indigo-800',
  emerald: 'bg-emerald-500/15 text-emerald-800',
  teal: 'bg-teal-500/15 text-teal-800',
  rose: 'bg-rose-500/15 text-rose-800',
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-ink',
};

export function Badge({ tone = 'slate', children, className = '' }: { tone?: string; children: ReactNode; className?: string }) {
  return <span className={`chip ${TONES[tone] ?? TONES.slate} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function Avatar({ name, size = 32, hue }: { name: string; size?: number; hue?: number }) {
  const h = hue ?? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `oklch(0.55 0.11 ${h})` }}>
      {initials(name)}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Section({ title, action, children, className = '', sub }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string; sub?: ReactNode }) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
        {icon && <span className="text-brand">{icon}</span>}
      </div>
      <div className="mt-1.5 font-display text-2xl font-extrabold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`rise max-h-[92vh] w-full overflow-auto rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-ink/5" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: ReactNode }[] }) {
  return (
    <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-card p-1">
      {items.map((it) => (
        <button key={it.key} role="tab" aria-selected={value === it.key} onClick={() => onChange(it.key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === it.key ? 'bg-brand text-brand-ink' : 'text-muted hover:text-ink'}`}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, required, help, error, children, htmlFor }: { label: string; required?: boolean; help?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label} {required && <span className="text-rose-600" aria-label="required">*</span>}
      </label>
      {children}
      {help && !error && <p className="mt-1 text-xs text-muted">{help}</p>}
      {error && <p className="mt-1 text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
}

export function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-brand-soft p-3 text-sm text-ink">
      <Info size={18} className="mt-0.5 shrink-0 text-brand" />
      <div>{children}</div>
    </div>
  );
}

/** The single progress visual used everywhere: six stages from the brief + Develop. */
export function StageTrack({ idea, compact }: { idea: Idea; compact?: boolean }) {
  const idx = stageIndex(idea.status, idea);
  const declined = idea.status === 'declined';
  const revision = idea.status === 'revision';
  return (
    <ol className={`flex w-full items-center ${compact ? 'gap-1' : 'gap-1.5'}`} aria-label={`Progress: ${STATUS_META[idea.status].label}`}>
      {STAGES.map((s, i) => {
        const done = i < idx || (i === idx && ['awarded', 'development'].includes(idea.status) && s.key !== 'develop');
        const current = i === idx;
        const color = declined && current ? 'bg-rose-500' : revision && current ? 'bg-amber-500' : done ? 'bg-brand' : current ? 'bg-brand/60' : 'bg-line';
        return (
          <li key={s.key} className="flex-1" title={`${s.label}: ${s.blurb}`}>
            <div className={`h-1.5 rounded-full ${color} ${current && !declined ? 'live-dot' : ''}`} />
            {!compact && <div className={`mt-1.5 text-[11px] font-semibold ${current ? 'text-ink' : 'text-muted'}`}>{s.label}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export function Bars({ data, max, fmt = (n: number) => String(n), color = 'var(--brand)' }: { data: { label: string; value: number; sub?: string }[]; max?: number; fmt?: (n: number) => string; color?: string }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex justify-between gap-2 text-sm"><span className="truncate">{d.label}</span><span className="font-semibold tabular-nums">{fmt(d.value)}{d.sub && <span className="ml-1 font-normal text-muted">{d.sub}</span>}</span></div>
          <div className="h-2 rounded-full bg-line/60"><div className="h-2 rounded-full transition-all" style={{ width: `${(d.value / m) * 100}%`, background: color }} /></div>
        </div>
      ))}
    </div>
  );
}

export function Spark({ values, height = 56, color = 'var(--brand)', label }: { values: number[]; height?: number; color?: string; label: string }) {
  const w = 300;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => `${i * step},${height - (v / max) * (height - 6) - 3}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label={label} preserveAspectRatio="none" style={{ height }}>
      <polygon points={`0,${height} ${pts} ${w},${height}`} fill={color} opacity={0.12} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Donut({ parts, size = 120, label }: { parts: { value: number; color: string; label: string }[]; size?: number; label: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  let acc = 0;
  const r = 15.915;
  return (
    <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label={label}>
      <circle cx="21" cy="21" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
      {parts.map((p) => {
        const pct = (p.value / total) * 100;
        const el = <circle key={p.label} cx="21" cy="21" r={r} fill="none" stroke={p.color} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={25 - acc} />;
        acc += pct;
        return el;
      })}
    </svg>
  );
}

export function PageHeader({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-bold uppercase tracking-wider text-brand">{eyebrow}</div>}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
