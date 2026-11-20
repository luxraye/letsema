'use client';
import { useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { Criterion, FieldDef, InstanceDefinition, Stage } from '@/db/schema';
import { saveDefinition } from '@/app/actions/admin';

const TABS = ['Basics', 'Timeline', 'Application form', 'Score sheet', 'Who can enter', 'Prizes'] as const;
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30) || `q_${Date.now().toString(36)}`;

export function StudioEditor({ id, live, def: initial, meta: m0, photos, rulesHash }: { id: string; live: boolean; def: InstanceDefinition; meta: { name: string; tagline: string; description: string; photo: string }; photos: string[]; rulesHash: string }) {
  const [def, setDef] = useState(initial);
  const [meta, setMeta] = useState(m0);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Basics');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ ok?: string; error?: string; errors?: string[] } | null>(null);
  const [pending, start] = useTransition();
  const set = (p: Partial<InstanceDefinition>) => setDef({ ...def, ...p });
  const move = <T,>(xs: T[], i: number, d: number) => { const c = [...xs]; const j = i + d; if (j < 0 || j >= c.length) return c; [c[i], c[j]] = [c[j], c[i]]; return c; };
  const weight = def.rubric.reduce((s, c) => s + c.weight, 0);
  const dirty = JSON.stringify(def) !== JSON.stringify(initial) || JSON.stringify(meta) !== JSON.stringify(m0);
  const save = () => start(async () => setMsg((await saveDefinition(id, JSON.stringify(def), reason, meta)) ?? null));
  const setStage = (i: number, p: Partial<Stage>) => set({ stages: def.stages.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const setField = (i: number, p: Partial<FieldDef>) => set({ form: def.form.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const setCrit = (i: number, p: Partial<Criterion>) => set({ rubric: def.rubric.map((s, j) => (j === i ? { ...s, ...p } : s)) });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0">
        <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 shadow-sm">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === t ? 'bg-ink text-white' : 'text-muted hover:text-fg'}`}>{t}</button>)}</div>
        <div className="card space-y-4 p-5">
          {tab === 'Basics' && <>
            <div><label className="label" htmlFor="n">Name</label><input id="n" className="field" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></div>
            <div><label className="label" htmlFor="t">Tagline</label><input id="t" className="field" value={meta.tagline} onChange={(e) => setMeta({ ...meta, tagline: e.target.value })} /></div>
            <div><label className="label" htmlFor="d">Description</label><textarea id="d" className="field min-h-24" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
            <div><div className="label">Cover photo</div><div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{photos.map((p) => <button key={p} type="button" onClick={() => setMeta({ ...meta, photo: p })} className={`aspect-video overflow-hidden rounded-lg border-2 ${meta.photo === p ? 'border-[var(--brand)]' : 'border-transparent'}`}><img src={p} alt="" className="size-full object-cover" /></button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="k">Type</label><select id="k" className="field" value={def.kind} onChange={(e) => set({ kind: e.target.value as InstanceDefinition['kind'] })}>{['call', 'ideas', 'hackathon', 'accelerator'].map((k) => <option key={k}>{k}</option>)}</select></div>
              <div><label className="label" htmlFor="a">Audience</label><select id="a" className="field" value={def.audience} onChange={(e) => set({ audience: e.target.value as 'public' | 'staff' })}><option value="public">Public</option><option value="staff">CEDA staff only</option></select></div>
            </div>
          </>}
          {tab === 'Timeline' && <>
            <p className="text-sm text-muted">Stages called “apply”, “register”, “build” or “submit” accept entries while they run.</p>
            {def.stages.map((s, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[8rem_1fr_9.5rem_9.5rem_auto]">
                <input className="field mono" aria-label="Key" value={s.key} onChange={(e) => setStage(i, { key: key(e.target.value) })} />
                <input className="field" aria-label="Label" value={s.label} onChange={(e) => setStage(i, { label: e.target.value })} />
                <input className="field" type="date" aria-label="Starts" value={s.starts} onChange={(e) => setStage(i, { starts: e.target.value })} />
                <input className="field" type="date" aria-label="Ends" value={s.ends} onChange={(e) => setStage(i, { ends: e.target.value })} />
                <div className="flex gap-1"><button type="button" className="btn-ghost !px-2" aria-label="Up" onClick={() => set({ stages: move(def.stages, i, -1) })}><ArrowUp size={14} /></button><button type="button" className="btn-ghost !px-2" aria-label="Remove" onClick={() => set({ stages: def.stages.filter((_, j) => j !== i) })}><Trash2 size={14} /></button></div>
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={() => set({ stages: [...def.stages, { key: `stage_${def.stages.length + 1}`, label: 'New stage', starts: def.stages.at(-1)?.ends ?? '2026-12-01', ends: def.stages.at(-1)?.ends ?? '2026-12-01' }] })}><Plus size={16} /> Add stage</button>
          </>}
          {tab === 'Application form' && <>
            {def.form.map((f, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-line p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                  <input className="field font-semibold" aria-label="Question" value={f.label} onChange={(e) => setField(i, { label: e.target.value })} />
                  <select className="field" aria-label="Answer type" value={f.type} onChange={(e) => setField(i, { type: e.target.value as FieldDef['type'], ...(e.target.value === 'file' ? { accept: ['pdf'], maxMb: 10 } : {}) })}>{['text', 'textarea', 'number', 'select', 'url', 'file'].map((t) => <option key={t}>{t}</option>)}</select>
                  <div className="flex gap-1"><button type="button" className="btn-ghost !px-2" aria-label="Up" onClick={() => set({ form: move(def.form, i, -1) })}><ArrowUp size={14} /></button><button type="button" className="btn-ghost !px-2" aria-label="Down" onClick={() => set({ form: move(def.form, i, 1) })}><ArrowDown size={14} /></button><button type="button" className="btn-ghost !px-2" aria-label="Remove" onClick={() => set({ form: def.form.filter((_, j) => j !== i) })}><Trash2 size={14} /></button></div>
                </div>
                <input className="field" aria-label="Help text" placeholder="Help text (optional)" value={f.help ?? ''} onChange={(e) => setField(i, { help: e.target.value || undefined })} />
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!f.required} onChange={(e) => setField(i, { required: e.target.checked })} /> Required</label>
                  {f.type === 'textarea' && <label className="flex items-center gap-1.5">Max words <input className="field !w-24 !py-1" inputMode="numeric" value={f.maxWords ?? ''} onChange={(e) => setField(i, { maxWords: Number(e.target.value) || undefined })} /></label>}
                  {f.type === 'select' && <input className="field !py-1" placeholder="Options, separated by commas" value={(f.options ?? []).join(', ')} onChange={(e) => setField(i, { options: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />}
                  {f.type === 'file' && <><label className="flex items-center gap-1.5">Types <input className="field !w-32 !py-1" value={(f.accept ?? []).join(',')} onChange={(e) => setField(i, { accept: e.target.value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) })} /></label><label className="flex items-center gap-1.5">Max MB <input className="field !w-16 !py-1" value={f.maxMb ?? ''} onChange={(e) => setField(i, { maxMb: Number(e.target.value) || undefined })} /></label><label className="flex items-center gap-1.5">Max pages <input className="field !w-16 !py-1" value={f.maxPages ?? ''} onChange={(e) => setField(i, { maxPages: Number(e.target.value) || undefined })} /></label></>}
                  <span className="mono text-xs text-muted">key: {f.key}</span>
                </div>
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={() => { const label = 'New question'; set({ form: [...def.form, { key: `${key(label)}_${def.form.length + 1}`, label, type: 'textarea', required: false }] }); }}><Plus size={16} /> Add question</button>
          </>}
          {tab === 'Score sheet' && <>
            <div className={`rounded-xl p-3 text-sm font-semibold ${weight === 100 ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>Weights add up to {weight}%{weight !== 100 && ' (must be 100%)'}</div>
            {def.rubric.map((c, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_6rem_auto]">
                <input className="field font-semibold" aria-label="Criterion" value={c.label} onChange={(e) => setCrit(i, { label: e.target.value })} />
                <input className="field" aria-label="Weight %" inputMode="numeric" value={c.weight} onChange={(e) => setCrit(i, { weight: Number(e.target.value) || 0 })} />
                <button type="button" className="btn-ghost !px-2" aria-label="Remove" onClick={() => set({ rubric: def.rubric.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
                <input className="field sm:col-span-3" aria-label="Guide for evaluators" placeholder="What does a 10 look like?" value={c.guide} onChange={(e) => setCrit(i, { guide: e.target.value })} />
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={() => set({ rubric: [...def.rubric, { key: `c_${def.rubric.length + 1}_${Date.now().toString(36).slice(-3)}`, label: 'New criterion', weight: 0, guide: '' }] })}><Plus size={16} /> Add criterion</button>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm"><span className="label">Evaluators per application</span><input className="field" inputMode="numeric" value={def.reviewersPerEntry} onChange={(e) => set({ reviewersPerEntry: Number(e.target.value) || 1 })} /></label>
              <label className="text-sm"><span className="label">Shortlist size</span><input className="field" inputMode="numeric" value={def.shortlistSize} onChange={(e) => set({ shortlistSize: Number(e.target.value) || 1 })} /></label>
            </div>
          </>}
          {tab === 'Who can enter' && <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm"><span className="label">Minimum age</span><input className="field" inputMode="numeric" value={def.eligibility.minAge ?? ''} onChange={(e) => set({ eligibility: { ...def.eligibility, minAge: Number(e.target.value) || undefined } })} /></label>
              <label className="text-sm"><span className="label">Maximum age</span><input className="field" inputMode="numeric" value={def.eligibility.maxAge ?? ''} onChange={(e) => set({ eligibility: { ...def.eligibility, maxAge: Number(e.target.value) || undefined } })} /></label>
              <label className="text-sm"><span className="label">Youth ownership must exceed (%)</span><input className="field" inputMode="numeric" value={def.eligibility.minYouthShare ?? ''} onChange={(e) => set({ eligibility: { ...def.eligibility, minYouthShare: Number(e.target.value) || undefined } })} /></label>
              <div className="space-y-2 pt-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={!!def.eligibility.citizenOnly} onChange={(e) => set({ eligibility: { ...def.eligibility, citizenOnly: e.target.checked } })} /> Citizens only</label><label className="flex items-center gap-2"><input type="checkbox" checked={!!def.eligibility.cipaRequired} onChange={(e) => set({ eligibility: { ...def.eligibility, cipaRequired: e.target.checked } })} /> CIPA-registered business</label></div>
              <label className="text-sm"><span className="label">Smallest team</span><input className="field" inputMode="numeric" value={def.team.min} onChange={(e) => set({ team: { ...def.team, min: Number(e.target.value) || 1 } })} /></label>
              <label className="text-sm"><span className="label">Largest team</span><input className="field" inputMode="numeric" value={def.team.max} onChange={(e) => set({ team: { ...def.team, max: Number(e.target.value) || 1 } })} /></label>
            </div>
          </>}
          {tab === 'Prizes' && <>
            {def.prizes.map((p, i) => <div key={i} className="grid grid-cols-[1fr_9rem_auto] gap-2"><input className="field" aria-label="Place" value={p.place} onChange={(e) => set({ prizes: def.prizes.map((x, j) => (j === i ? { ...x, place: e.target.value } : x)) })} /><input className="field" aria-label="Amount (Pula)" inputMode="numeric" value={p.amount} onChange={(e) => set({ prizes: def.prizes.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)) })} /><button type="button" className="btn-ghost !px-2" aria-label="Remove" onClick={() => set({ prizes: def.prizes.filter((_, j) => j !== i) })}><Trash2 size={14} /></button></div>)}
            <button type="button" className="btn-ghost" onClick={() => set({ prizes: [...def.prizes, { place: `${def.prizes.length + 1}`, amount: 0 }] })}><Plus size={16} /> Add prize</button>
          </>}
        </div>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card space-y-3 p-4 text-sm">
          <div className="font-bold">{live ? 'Publish a change' : 'Save draft'}</div>
          <div className="text-xs text-muted">Current rules fingerprint</div><div className="mono break-all rounded-lg bg-sand p-2 text-[11px]">{rulesHash}</div>
          {live && <><label className="label" htmlFor="reason">Reason for the change (shown publicly)</label><textarea id="reason" className="field min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Deadline extended by 3 days after a power outage." /></>}
          <button onClick={save} disabled={pending || !dirty} className="btn-primary w-full">{pending ? 'Saving…' : live ? 'Publish new version' : 'Save draft'}</button>
          {msg?.ok && <p className="rounded-lg bg-emerald-50 p-2 text-emerald-900">{msg.ok}</p>}
          {msg?.error && <div className="rounded-lg bg-rose-50 p-2 text-rose-900">{msg.error}{msg.errors && <ul className="mt-1 list-disc pl-4">{msg.errors.map((e) => <li key={e}>{e}</li>)}</ul>}</div>}
          {!dirty && <p className="text-xs text-muted">No unsaved changes.</p>}
        </div>
      </aside>
    </div>
  );
}
