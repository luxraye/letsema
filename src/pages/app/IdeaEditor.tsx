import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Check, CloudOff, FileUp, Lightbulb, Paperclip, Trash2, Users2, Copy } from 'lucide-react';
import { useMe, useStore, Button, Field, PageHeader, Modal, toast, Badge, Tip, Empty } from '../../ui/kit';
import { saveDraft, submitIdea, validateIdea, ActionError, receipt } from '../../core/actions';
import { similar } from '../../core/similarity';
import { sha256Bytes } from '../../core/sha256';
import type { Attachment, Campaign, Idea } from '../../core/types';
import { uid, fmtDateTime } from '../../core/util';

const DISTRICTS = ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Serowe', 'Palapye', 'Molepolole', 'Kanye', 'Lobatse', 'Selebi-Phikwe', 'Ghanzi', 'Tsabong', 'Mahalapye', 'Jwaneng', 'Letlhakane', 'Mochudi', 'Other'];
const SECTORS = ['Agriculture', 'Agro-processing', 'Livestock', 'Energy', 'Water', 'Waste', 'Mobility', 'Fintech', 'Digital services', 'Health tech', 'Education', 'Tourism', 'Creative', 'Manufacturing', 'Construction', 'E-commerce', 'Other'];

interface Draft { campaignId: string; title: string; summary: string; sector: string; district: string; team: string[]; answers: Record<string, string>; attachments: Attachment[] }

const STEPS = ['Basics', 'Your answers', 'Documents', 'Check & submit'];

export default function IdeaEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const me = useMe()!;
  const s = useStore();
  const nav = useNavigate();
  const existing = id ? s.ideas.find((i) => i.id === id && i.ownerId === me.id) : undefined;
  const eligibleCalls = s.campaigns.filter((c) => c.status === 'open' && (c.track !== 'staff' || me.staff));
  const localKey = `letsema:draft:${me.id}:${id ?? params.get('call') ?? 'new'}`;
  const [d, setD] = useState<Draft>(() => {
    if (existing) return { campaignId: existing.campaignId, title: existing.title, summary: existing.summary, sector: existing.sector, district: existing.district, team: existing.team, answers: { ...existing.answers }, attachments: [...existing.attachments] };
    try { const raw = localStorage.getItem(localKey); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
    return { campaignId: params.get('call') ?? eligibleCalls[0]?.id ?? '', title: '', summary: '', sector: '', district: me.district ?? '', team: [], answers: {}, attachments: [] };
  });
  const [step, setStep] = useState(0);
  const [ideaId, setIdeaId] = useState<string | undefined>(existing?.id);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [done, setDone] = useState<null | ReturnType<typeof receipt>>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [member, setMember] = useState('');
  const c: Campaign | undefined = s.campaigns.find((x) => x.id === d.campaignId);
  const locked = existing && !['draft', 'revision'].includes(existing.status);

  // Autosave to the device on every change (works offline), and to the account every few seconds.
  useEffect(() => {
    try { localStorage.setItem(localKey, JSON.stringify(d)); } catch { /* ignore */ }
    if (locked || !c || c.status !== 'open') return;
    const tm = setTimeout(() => {
      if (!navigator.onLine) return;
      if (!d.title.trim() && !d.summary.trim()) return;
      try {
        const idea = saveDraft(me, { id: ideaId, ...d });
        setIdeaId(idea.id);
        setSavedAt(new Date().toISOString());
      } catch { /* shown on submit */ }
    }, 1200);
    return () => clearTimeout(tm);
  }, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const missing = useMemo(() => (c ? validateIdea(c, d) : []), [c, d]);
  const missingIds = new Set(missing.map((m) => m.field));
  const err = (f: string) => (showErrors && missingIds.has(f) ? missing.find((m) => m.field === f)!.label : undefined);

  const related = useMemo(() => {
    const text = `${d.title} ${d.summary} ${d.answers.problem ?? ''} ${d.answers.solution ?? ''}`;
    return similar<Idea>(text, s.ideas.filter((i) => i.id !== ideaId && i.status !== 'draft').map((i) => ({ item: i, text: `${i.title} ${i.summary} ${i.answers.problem ?? ''}` })), 3, 0.14);
  }, [d.title, d.summary, d.answers.problem, d.answers.solution, s.ideas, ideaId]);

  if (!eligibleCalls.length && !existing) return <Empty title="No calls are open for you right now"><Link className="text-brand underline" to="/calls">See all calls</Link></Empty>;
  if (locked) return <Empty title="This idea is locked while it is being evaluated"><Link className="text-brand underline" to={`/app/ideas/${existing!.id}`}>Back to the idea</Link></Empty>;

  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const setAns = (k: string, v: string) => setD((x) => ({ ...x, answers: { ...x.answers, [k]: v } }));

  const onFile = async (docId: string, accept: string, maxMb: number, file?: File) => {
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    if (!accept.split(',').includes(ext)) return toast(`That file type is not accepted here. Use ${accept}.`, 'err');
    if (file.size > maxMb * 1024 * 1024) return toast(`File is larger than ${maxMb} MB.`, 'err');
    const buf = new Uint8Array(await file.arrayBuffer());
    // Reject executables disguised as documents (checks the file's real header bytes).
    if (buf[0] === 0x4d && buf[1] === 0x5a) return toast('This file is a program, not a document. Upload refused.', 'err');
    if (ext === '.pdf' && !(buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) return toast('This does not look like a real PDF file.', 'err');
    const att: Attachment = { id: uid('f'), name: file.name, size: file.size, type: file.type, sha256: sha256Bytes(buf), docId };
    set({ attachments: [...d.attachments.filter((a) => a.docId !== docId), att] });
    toast(`${file.name} attached and fingerprinted`);
  };
  const demoFile = (docId: string, name: string) => set({ attachments: [...d.attachments.filter((a) => a.docId !== docId), { id: uid('f'), name, size: 248_000, type: 'application/pdf', sha256: sha256Bytes(new TextEncoder().encode(name + Date.now())), docId }] });

  const submit = () => {
    setShowErrors(true);
    if (missing.length) { toast(`${missing.length} item${missing.length > 1 ? 's' : ''} still missing. They are highlighted.`, 'err'); return; }
    try {
      const idea = saveDraft(me, { id: ideaId, ...d });
      setIdeaId(idea.id);
      if (existing?.status === 'revision') { nav(`/app/ideas/${idea.id}?resubmit=1`); return; }
      const r = submitIdea(me, idea.id);
      try { localStorage.removeItem(localKey); } catch { /* ignore */ }
      setDone(r);
    } catch (e) { toast(e instanceof ActionError ? e.message : 'Could not submit. Try again.', 'err'); }
  };

  return (
    <div>
      <PageHeader eyebrow={existing?.status === 'revision' ? 'Revising your idea' : 'New idea'} title={d.title || 'Tell us your idea'}
        sub={c ? <>For <b>{c.title}</b>. Fields marked <span className="text-rose-600">*</span> are required.</> : undefined}
        actions={<div className="flex items-center gap-2 text-sm text-muted">{!online ? <><CloudOff size={16} className="text-amber-600" /> Offline: saved on this device</> : savedAt ? <><Check size={16} className="text-brand" /> Saved {fmtDateTime(savedAt)}</> : 'Saves automatically'}</div>} />

      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li key={label}><button onClick={() => setStep(i)} className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${i === step ? 'border-brand bg-brand-soft' : 'border-line bg-card'}`} aria-current={i === step ? 'step' : undefined}>
            <span className="block text-xs text-muted">Step {i + 1}</span><span className="hidden sm:inline">{label}</span>
          </button></li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card space-y-5 p-5 sm:p-6">
          {step === 0 && (<>
            {!existing && (
              <Field label="Call" required htmlFor="call"><select id="call" className="field" value={d.campaignId} onChange={(e) => set({ campaignId: e.target.value })}>{eligibleCalls.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
            )}
            <Field label="Idea title" required htmlFor="title" error={err('title')} help="Short and specific, e.g. “Solar cold rooms for informal traders”."><input id="title" className="field" maxLength={90} value={d.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="One-paragraph summary" required htmlFor="summary" error={err('summary')} help={`${d.summary.length}/400 characters`}><textarea id="summary" className="field min-h-24" maxLength={400} value={d.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sector" htmlFor="sector"><select id="sector" className="field" value={d.sector} onChange={(e) => set({ sector: e.target.value })}><option value="">Choose…</option>{SECTORS.map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="District" htmlFor="district"><select id="district" className="field" value={d.district} onChange={(e) => set({ district: e.target.value })}><option value="">Choose…</option>{DISTRICTS.map((x) => <option key={x}>{x}</option>)}</select></Field>
            </div>
            <Field label="Team members (co-founders or co-authors)" htmlFor="team">
              <div className="flex gap-2"><input id="team" className="field" value={member} placeholder="Full name" onChange={(e) => setMember(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && member.trim()) { e.preventDefault(); set({ team: [...d.team, member.trim()] }); setMember(''); } }} /><Button type="button" variant="secondary" onClick={() => { if (member.trim()) { set({ team: [...d.team, member.trim()] }); setMember(''); } }}><Users2 size={16} /> Add</Button></div>
              <div className="mt-2 flex flex-wrap gap-2">{d.team.map((t, i) => <Badge key={i}>{t} <button onClick={() => set({ team: d.team.filter((_, j) => j !== i) })} aria-label={`Remove ${t}`}>×</button></Badge>)}</div>
            </Field>
          </>)}

          {step === 1 && c && c.form.map((f) => {
            const v = d.answers[f.id] ?? '';
            const id2 = `q_${f.id}`;
            return (
              <Field key={f.id} label={f.label} required={f.required} help={f.help ?? (f.maxLength ? `${v.length}/${f.maxLength} characters` : undefined)} error={err(f.id)} htmlFor={id2}>
                {f.type === 'textarea' ? <textarea id={id2} className="field min-h-28" maxLength={f.maxLength} value={v} onChange={(e) => setAns(f.id, e.target.value)} />
                  : f.type === 'select' ? <select id={id2} className="field" value={v} onChange={(e) => setAns(f.id, e.target.value)}><option value="">Choose…</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                  : f.type === 'checkbox' ? <label className="flex items-center gap-3 rounded-xl bg-paper p-3"><input id={id2} type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={v === 'yes'} onChange={(e) => setAns(f.id, e.target.checked ? 'yes' : '')} /> Yes, this is true</label>
                  : <input id={id2} className="field" type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'} min={f.min} max={f.max} value={v} onChange={(e) => setAns(f.id, e.target.value)} placeholder={f.type === 'url' ? 'https://' : ''} />}
              </Field>
            );
          })}

          {step === 2 && c && (<>
            {!c.documents.length && <p className="text-muted">This call does not need any documents.</p>}
            {c.documents.map((doc) => {
              const att = d.attachments.find((a) => a.docId === doc.id);
              return (
                <div key={doc.id} className={`rounded-xl border p-4 ${err(`doc:${doc.id}`) ? 'border-rose-400 bg-rose-50/50' : 'border-line'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><div className="font-semibold">{doc.name} {doc.required && <span className="text-rose-600">*</span>}</div><div className="text-xs text-muted">{doc.accept} · up to {doc.maxMb} MB</div></div>
                    <div className="flex gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm font-semibold hover:border-ink/30"><FileUp size={16} /> {att ? 'Replace' : 'Upload'}<input type="file" className="sr-only" accept={doc.accept} onChange={(e) => onFile(doc.id, doc.accept, doc.maxMb, e.target.files?.[0])} /></label>
                      {!att && <Button variant="ghost" size="sm" onClick={() => demoFile(doc.id, `${doc.id}-sample.pdf`)}>Use sample file</Button>}
                    </div>
                  </div>
                  {att && <div className="mt-3 flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-sm"><Paperclip size={14} /><span className="flex-1 truncate">{att.name}</span><code className="hidden text-xs text-muted sm:inline" title="SHA-256 fingerprint">{att.sha256.slice(0, 12)}…</code><button onClick={() => set({ attachments: d.attachments.filter((a) => a !== att) })} aria-label="Remove file"><Trash2 size={15} /></button></div>}
                </div>
              );
            })}
            <Tip>Every file is checked for its real type (so programs disguised as documents are refused) and fingerprinted with SHA-256. The fingerprint goes on your receipt, so nobody can swap your file later.</Tip>
          </>)}

          {step === 3 && c && (<>
            <h2 className="text-lg font-bold">Ready to submit?</h2>
            {missing.length ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm">
                <b className="text-amber-900">Still needed ({missing.length}):</b>
                <ul className="mt-2 list-disc space-y-1 pl-5">{missing.map((m) => <li key={m.field}><button className="text-left underline" onClick={() => { setShowErrors(true); setStep(m.field === 'title' || m.field === 'summary' ? 0 : m.field.startsWith('doc:') ? 2 : 1); }}>{m.label}</button></li>)}</ul>
              </div>
            ) : <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900"><Check size={18} /> Everything required is complete.</div>}
            <dl className="divide-y divide-line rounded-xl border border-line text-sm">
              <div className="grid grid-cols-3 gap-2 p-3"><dt className="text-muted">Title</dt><dd className="col-span-2">{d.title || '—'}</dd></div>
              <div className="grid grid-cols-3 gap-2 p-3"><dt className="text-muted">Summary</dt><dd className="col-span-2">{d.summary || '—'}</dd></div>
              {c.form.map((f) => <div key={f.id} className="grid grid-cols-3 gap-2 p-3"><dt className="text-muted">{f.label}</dt><dd className="col-span-2 whitespace-pre-wrap">{d.answers[f.id] || '—'}</dd></div>)}
              <div className="grid grid-cols-3 gap-2 p-3"><dt className="text-muted">Files</dt><dd className="col-span-2">{d.attachments.map((a) => a.name).join(', ') || '—'}</dd></div>
            </dl>
            <p className="text-xs text-muted">By submitting you confirm the information is true and that you have the right to submit it. After submission the idea is locked while it is evaluated; you can still reply to feedback.</p>
          </>)}

          <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => (step ? setStep(step - 1) : nav(-1))}>{step ? 'Back' : 'Cancel'}</Button>
            {step < 3 ? <Button onClick={() => setStep(step + 1)}>Continue</Button> : <Button onClick={submit} disabled={!online}>{existing?.status === 'revision' ? 'Save and continue to resubmit' : 'Submit idea'}</Button>}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="text-sm font-bold">Completeness</div>
            <div className="mt-2 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${c ? Math.round(((c.form.length + c.documents.length + 2 - missing.length) / (c.form.length + c.documents.length + 2)) * 100) : 0}%` }} /></div>
            <div className="mt-1 text-xs text-muted">{missing.length ? `${missing.length} required item${missing.length > 1 ? 's' : ''} left` : 'All required items complete'}</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm font-bold"><Lightbulb size={16} className="text-accent" /> Similar ideas</div>
            {related.length ? (
              <ul className="mt-3 space-y-3">{related.map((r) => (
                <li key={r.item.id} className="text-sm"><div className="font-semibold">{r.item.showcase ? r.item.title : `Idea ${r.item.ref}`}</div><div className="text-xs text-muted">{Math.round(r.score * 100)}% similar · shares “{r.shared.slice(0, 3).join('”, “')}”</div></li>
              ))}<li className="text-xs text-muted">Consider what makes yours different, or collaborate. This check runs on your device.</li></ul>
            ) : <p className="mt-2 text-xs text-muted">As you write, we check the idea bank for ideas like yours, so you can stand out or team up.</p>}
          </div>
        </aside>
      </div>

      <Modal open={!!done} onClose={() => nav('/app/ideas')} title="Submitted. Here is your receipt.">
        {done && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft p-5 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-brand">Reference</div>
              <div className="font-mono text-3xl font-extrabold">{done.ref}</div>
              <div className="mt-1 text-sm text-muted">Version {done.version} · {fmtDateTime(done.at)}</div>
            </div>
            <div><div className="text-xs font-semibold text-muted">Receipt fingerprint (SHA-256)</div><div className="mt-1 flex items-center gap-2"><code className="block flex-1 break-all rounded-lg bg-paper p-2 text-xs">{done.fingerprint}</code><button onClick={() => navigator.clipboard?.writeText(done.fingerprint).then(() => toast('Copied'))} aria-label="Copy fingerprint"><Copy size={16} /></button></div></div>
            <p className="text-sm text-muted">We sent this to you by email{me.alerts.sms ? ' and SMS' : ''}. Anyone can check it at Verify; track progress any time with the reference.</p>
            <div className="flex gap-2"><Button onClick={() => nav(`/app/ideas/${ideaId}`)}>Open my idea</Button><Button variant="secondary" onClick={() => nav('/app/ideas')}>All my ideas</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

