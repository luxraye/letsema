'use client';
import { useState } from 'react';
import type { Criterion } from '@/db/schema';
import { Submit } from '@/components/forms';

export function ScoreForm({ action, rubric }: { action: (fd: FormData) => void; rubric: Criterion[] }) {
  const [s, setS] = useState<Record<string, number>>(Object.fromEntries(rubric.map((c) => [c.key, 5])));
  const [fb, setFb] = useState('');
  const total = Math.round(rubric.reduce((t, c) => t + (s[c.key] / 10) * c.weight, 0) * 10) / 10;
  return (
    <form action={action} className="card space-y-4 p-5">
      <div className="flex items-end justify-between"><h2 className="text-lg font-bold">Score sheet</h2><div className="text-right"><div className="text-xs text-muted">Weighted total</div><div className="text-3xl font-extrabold">{total}</div></div></div>
      {rubric.map((c) => (
        <div key={c.key}>
          <div className="flex justify-between gap-2 text-sm"><label htmlFor={c.key} className="font-semibold">{c.label} <span className="font-normal text-muted">({c.weight}%)</span></label><b>{s[c.key]}/10</b></div>
          <input id={c.key} name={`s_${c.key}`} type="range" min={0} max={10} step={1} value={s[c.key]} onChange={(e) => setS({ ...s, [c.key]: Number(e.target.value) })} className="w-full accent-[var(--brand)]" />
          <p className="text-xs text-muted">{c.guide}</p>
        </div>
      ))}
      <div><label className="label" htmlFor="feedback">Feedback for the applicant</label><textarea id="feedback" name="feedback" className="field min-h-28" value={fb} onChange={(e) => setFb(e.target.value)} placeholder="What is strong, and what would make it fundable? The applicant will read this." /><div className="text-right text-xs text-muted">{fb.trim().length < 20 ? `${20 - fb.trim().length} more characters needed` : 'Good'}</div></div>
      <div><label className="label" htmlFor="private">Private note for the panel <span className="font-normal text-muted">(optional)</span></label><textarea id="private" name="private" className="field min-h-16" /></div>
      <Submit className="btn-primary w-full" pending="Sealing your scores…">Submit scores</Submit>
      <p className="text-xs text-muted">You cannot change scores after submitting. They are recorded in the audit trail.</p>
    </form>
  );
}
