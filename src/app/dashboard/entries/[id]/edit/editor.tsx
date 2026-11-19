'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, CloudOff, Loader2, Plus, Trash2, Upload, AlertTriangle, Send, Lightbulb } from 'lucide-react';
import type { InstanceDefinition, TeamMember } from '@/db/schema';
import { saveDraft, submitEntry, uploadFile } from '@/app/actions/entries';

type Entry = { id: string; ref: string; status: string; title: string; summary: string; sector: string; answers: Record<string, string>; team: TeamMember[]; version: number; updatedAt: string };
type FileRow = { field: string; name: string; size: number; sha256: string; pages: number | null };
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function Editor({ entry, instance, files, revision }: { entry: Entry; instance: { name: string; slug: string; def: InstanceDefinition }; files: FileRow[]; revision?: string }) {
  const def = instance.def;
  const key = `ceda:draft:${entry.id}`;
  const [data, setData] = useState({ title: entry.title === 'Untitled application' ? '' : entry.title, summary: entry.summary, sector: entry.sector, answers: entry.answers, team: entry.team });
  const [save, setSave] = useState<'saved' | 'saving' | 'offline' | 'error'>('saved');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[] | null>(null);
  const [fileMsg, setFileMsg] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const dirty = useRef(false);
  const steps = useMemo(() => ['About', 'Questions', 'Team', 'Review'], []);
  const [step, setStep] = useState(0);

  // Restore an offline copy if it is newer than the server's.
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) { const local = JSON.parse(raw); if (local.at > entry.updatedAt) { setData(local.data); dirty.current = true; } } } catch {}
  }, [key, entry.updatedAt]);
  const update = (patch: Partial<typeof data>) => { setData((d) => { const n = { ...d, ...patch }; try { localStorage.setItem(key, JSON.stringify({ at: new Date().toISOString(), data: n })); } catch {} return n; }); dirty.current = true; };
  const flush = async () => {
    if (!dirty.current) return;
    if (!navigator.onLine) { setSave('offline'); return; }
    setSave('saving');
    try { const r = await saveDraft(entry.id, { ...data, title: data.title || 'Untitled application' }); if ('error' in r && r.error) { setSave('error'); return; } dirty.current = false; setSave('saved'); setSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })); } catch { setSave('offline'); }
  };
  useEffect(() => { const t = setTimeout(flush, 1200); return () => clearTimeout(t); });
  useEffect(() => { const on = () => flush(); window.addEventListener('online', on); return () => window.removeEventListener('online', on); });

  const upload = async (field: string, file: File) => {
    setFileMsg((m) => ({ ...m, [field]: 'Checking…' }));
    const fd = new FormData(); fd.set('file', file);
    const r = await uploadFile(entry.id, field, fd);
    setFileMsg((m) => ({ ...m, [field]: r.error ?? r.ok ?? '' }));
    router.refresh();
  };
  const submit = () => start(async () => {
    await flush();
    const r = await submitEntry(entry.id);
    if ('error' in r && r.error) { setProblems(r.problems ?? [r.error]); return; }
    try { localStorage.removeItem(key); } catch {}
    router.push(`/dashboard/entries/${entry.id}?submitted=1`);
  });
  const setMember = (i: number, patch: Partial<TeamMember>) => update({ team: data.team.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const required = def.form.filter((f) => f.required);
  const doneCount = required.filter((f) => (f.type === 'file' ? files.some((x) => x.field === f.key) : (data.answers[f.key] ?? '').trim())).length + (data.title ? 1 : 0);
  const pct = Math.round((doneCount / (required.length + 1)) * 100);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-sm text-muted"><Link href={`/i/${instance.slug}`} className="hover:underline">{instance.name}</Link> · <span className="mono">{entry.ref}</span></div><h1 className="text-3xl font-bold">{entry.status === 'returned' ? 'Update and resubmit' : 'Your application'}</h1></div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm shadow-sm" aria-live="polite">
          {save === 'saving' && <><Loader2 size={15} className="animate-spin" /> Saving…</>}
          {save === 'saved' && <><Check size={15} className="text-emerald-600" /> {savedAt ? `Saved ${savedAt}` : 'All changes saved'}</>}
          {save === 'offline' && <><CloudOff size={15} className="text-amber-600" /> Offline: saved on this device, will sync</>}
          {save === 'error' && <><AlertTriangle size={15} className="text-rose-600" /> Could not save</>}
        </div>
      </div>
      {revision && <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm"><div className="font-bold">CEDA asked for changes</div><p className="mt-1">{revision}</p><p className="mt-2 text-xs text-muted">Your last version is kept. Reviewers will see exactly what you changed.</p></div>}
      <div className="mb-6"><div className="mb-1 flex justify-between text-xs font-semibold text-muted"><span>{pct}% of required parts done</span><span>Step {step + 1} of {steps.length}</span></div><div className="h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} /></div></div>
      <ol className="mb-6 grid grid-cols-4 gap-2 text-sm">{steps.map((s, i) => <li key={s}><button onClick={() => setStep(i)} className={`w-full rounded-xl border px-2 py-2 font-semibold ${i === step ? 'border-[var(--brand)] bg-white text-ink' : 'border-transparent text-muted hover:bg-white'}`}>{i + 1}. {s}</button></li>)}</ol>

      <div className="card space-y-5 p-5 sm:p-6">
        {step === 0 && <>
          <div><label className="label" htmlFor="title">Name of your idea or business</label><input id="title" className="field" value={data.title} maxLength={140} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. SoilSense: low-cost soil moisture for smallholders" /></div>
          <div><label className="label" htmlFor="summary">One-line summary</label><input id="summary" className="field" value={data.summary} maxLength={400} onChange={(e) => update({ summary: e.target.value })} placeholder="What it does, for whom" /><SimilarHint text={`${data.title} ${data.summary}`} slug={instance.slug} /></div>
          {def.sectors.length > 1 && <div><label className="label" htmlFor="sector">Sector</label><select id="sector" className="field" value={data.sector} onChange={(e) => update({ sector: e.target.value })}><option value="">Choose…</option>{def.sectors.map((s) => <option key={s}>{s}</option>)}</select></div>}
        </>}
        {step === 1 && def.form.map((f) => {
          const v = data.answers[f.key] ?? ''; const w = words(v); const over = f.maxWords && w > f.maxWords;
          const file = files.find((x) => x.field === f.key);
          return (
            <div key={f.key}>
              <label className="label" htmlFor={f.key}>{f.label}{f.required && <span className="text-[var(--brand)]"> *</span>}</label>
              {f.help && <p className="-mt-1 mb-2 text-xs text-muted">{f.help}</p>}
              {f.type === 'textarea' && <><textarea id={f.key} className="field min-h-32" value={v} onChange={(e) => update({ answers: { ...data.answers, [f.key]: e.target.value } })} />{f.maxWords && <div className={`mt-1 text-right text-xs ${over ? 'font-bold text-rose-700' : 'text-muted'}`}>{w} / {f.maxWords} words</div>}</>}
              {(f.type === 'text' || f.type === 'url') && <input id={f.key} className="field" type={f.type === 'url' ? 'url' : 'text'} value={v} onChange={(e) => update({ answers: { ...data.answers, [f.key]: e.target.value } })} placeholder={f.type === 'url' ? 'https://' : ''} />}
              {f.type === 'number' && <input id={f.key} className="field" inputMode="numeric" value={v} onChange={(e) => update({ answers: { ...data.answers, [f.key]: e.target.value.replace(/[^\d.]/g, '') } })} />}
              {f.type === 'select' && <select id={f.key} className="field" value={v} onChange={(e) => update({ answers: { ...data.answers, [f.key]: e.target.value } })}><option value="">Choose…</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>}
              {f.type === 'file' && (
                <div className="rounded-xl border border-dashed border-line p-4">
                  {file && <div className="mb-2 text-sm"><b>{file.name}</b> · {(file.size / 1024).toFixed(0)} KB{file.pages ? ` · ${file.pages} pages` : ''} <span className="mono text-xs text-muted">sha256 {file.sha256.slice(0, 12)}…</span></div>}
                  <label className="btn-ghost cursor-pointer"><Upload size={16} /> {file ? 'Replace file' : 'Upload file'}<input id={f.key} type="file" className="sr-only" accept={(f.accept ?? []).map((a) => `.${a}`).join(',')} onChange={(e) => e.target.files?.[0] && upload(f.key, e.target.files[0])} /></label>
                  <p className="mt-2 text-xs text-muted">{(f.accept ?? []).join(', ').toUpperCase()} up to {f.maxMb} MB{f.maxPages ? `, max ${f.maxPages} pages` : ''}. We check the real file type and scan for leaked passwords or keys.</p>
                  {fileMsg[f.key] && <p role="status" className="mt-1 text-sm">{fileMsg[f.key]}</p>}
                </div>
              )}
            </div>
          );
        })}
        {step === 2 && <>
          <p className="text-sm text-muted">Teams of {def.team.min} to {def.team.max}. One person is the team lead.</p>
          {data.team.map((m, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_1fr_8rem_6rem_auto]">
              <input className="field" aria-label="Name" placeholder="Full name" value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} />
              <input className="field" aria-label="Email" placeholder="Email" value={m.email} onChange={(e) => setMember(i, { email: e.target.value })} />
              <input className="field" aria-label="Role" placeholder="Role" value={m.role ?? ''} onChange={(e) => setMember(i, { role: e.target.value })} />
              <input className="field" aria-label="Share %" placeholder="Share %" inputMode="numeric" value={m.share ?? ''} onChange={(e) => setMember(i, { share: Number(e.target.value) || 0 })} />
              <button type="button" disabled={m.lead} onClick={() => update({ team: data.team.filter((_, j) => j !== i) })} className="btn-ghost !px-3" aria-label="Remove member"><Trash2 size={16} /></button>
            </div>
          ))}
          {data.team.length < def.team.max && <button type="button" className="btn-ghost" onClick={() => update({ team: [...data.team, { name: '', email: '', share: 0 }] })}><Plus size={16} /> Add team member</button>}
        </>}
        {step === 3 && <>
          <h2 className="text-lg font-bold">Check and submit</h2>
          <ul className="space-y-1 text-sm">
            <li>{data.title ? '✅' : '⬜'} Title</li>
            {def.form.filter((f) => f.required).map((f) => <li key={f.key}>{(f.type === 'file' ? files.some((x) => x.field === f.key) : (data.answers[f.key] ?? '').trim()) ? '✅' : '⬜'} {f.label}</li>)}
            <li>{data.team.length >= def.team.min ? '✅' : '⬜'} Team ({data.team.length})</li>
          </ul>
          <p className="text-sm text-muted">When you submit, we run the checks, lock your answers and seal them with a fingerprint. You get a receipt with your reference. You cannot change it after that unless CEDA asks for changes.</p>
          {problems && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900"><b>Please fix these first:</b><ul className="mt-1 list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul></div>}
          <button onClick={submit} disabled={pending} className="btn-primary !px-6 !py-3 text-base">{pending ? <><Loader2 size={18} className="animate-spin" /> Checking and sealing…</> : <><Send size={18} /> {entry.status === 'returned' ? 'Resubmit' : 'Submit application'}</>}</button>
        </>}
      </div>
      <div className="mt-4 flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="btn-ghost">Back</button>
        {step < steps.length - 1 && <button onClick={() => setStep(step + 1)} className="btn-primary">Next</button>}
      </div>
    </div>
  );
}

/** While you type, look for similar ideas already submitted, so innovators can sharpen what makes theirs different. */
function SimilarHint({ text, slug }: { text: string; slug: string }) {
  const [hits, setHits] = useState<{ title: string; score: number }[]>([]);
  useEffect(() => {
    if (text.trim().length < 12) { setHits([]); return; }
    const t = setTimeout(async () => { const r = await fetch(`/api/similar?slug=${slug}&q=${encodeURIComponent(text)}`).then((x) => x.json()).catch(() => null); setHits(r?.hits ?? []); }, 700);
    return () => clearTimeout(t);
  }, [text, slug]);
  if (!hits.length) return null;
  return <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-950"><div className="flex items-center gap-1 font-bold"><Lightbulb size={14} /> Similar ideas were submitted before</div><ul className="mt-1 list-disc pl-5">{hits.map((h) => <li key={h.title}>{h.title} <span className="text-muted">({Math.round(h.score * 100)}% similar)</span></li>)}</ul><div className="mt-1">That is fine. Say clearly what makes yours different.</div></div>;
}
