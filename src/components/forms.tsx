'use client';
import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

export function Submit({ children, className = 'btn-primary w-full !py-3', pending = 'Please wait…' }: { children: ReactNode; className?: string; pending?: string }) {
  const { pending: p } = useFormStatus();
  return <button className={className} disabled={p} aria-busy={p}>{p ? pending : children}</button>;
}
export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.ok}</p>;
  return null;
}
