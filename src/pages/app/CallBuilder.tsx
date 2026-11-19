import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowDown, ArrowUp, Plus, Trash2, Eye } from 'lucide-react';
import { useMe, useStore, PageHeader, Button, Field, Section, attempt, Empty, Badge, Modal } from '../../ui/kit';
import { saveCampaign, deleteCampaign } from '../../core/actions';
import type { Campaign, FieldType, FormField } from '../../core/types';
import { uid } from '../../core/util';

const TYPES: { v: FieldType; l: string }[] = [{ v: 'text', l: 'Short text' }, { v: 'textarea', l: 'Long text' }, { v: 'select', l: 'Choice list' }, { v: 'number', l: 'Number' }, { v: 'checkbox', l: 'Yes/No declaration' }, { v: 'url', l: 'Web link' }];
const toLocal = (iso: string) => iso.slice(0, 10);

export default function CallBuilder() {
  const { id } = useParams();
  const me = useMe()!;
  const s = useStore();
  const nav = useNavigate();
  const orig = s.campaigns.find((c) => c.id === id);
  const [c, setC] = useState<Campaign | undefined>(orig ? structuredClone(orig) : undefined);
  const [preview, setPreview] = useState(false);
  useEffect(() => { if (orig && !c) setC(structuredClone(orig)); }, [orig, c]);
  if (!c) return <Empty title="Call not found" />;
  const entries = s.ideas.filter((i) => i.campaignId === c.id && i.status !== 'draft').length;
  const total = c.criteria.reduce((a, x) => a + x.weight, 0) || 1;
  const set = (p: Partial<Campaign>) => setC({ ...c, ...p });
  const setField = (i: number, p: Partial<FormField>) => set({ form: c.form.map((f, j) => (j === i ? { ...f, ...p } : f)) });
  const move = <T,>(arr: T[], i: number, d: number) => { const a = [...arr]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x!); return a; };
  const dirty = JSON.stringify(c) !== JSON.stringify(orig);
  return (
    <div>
      <div className="mb-2 text-sm"><Link to="/app/admin/calls" className="font-semibold text-brand">← All calls</Link></div>
      <PageHeader title={c.title} sub={entries ? `${entries} entries so far. Changes to criteria are recorded in the audit trail.` : 'Nobody has entered yet.'}
        actions={<>
          <Button variant="secondary" onClick={() => setPreview(true)}><Eye size={16} /> Preview form</Button>
          {c.status === 'draft' && <Button variant="accent" onClick={() => { const n = { ...c, status: 'open' as const }; if (attempt(() => saveCampaign(me, n), 'Published. It is now visible on the public site.') !== undefined) setC(n); }}>Publish</Button>}
          <Button disabled={!dirty} onClick={() => attempt(() => saveCampaign(me, c), 'Saved')}>Save changes</Button>
        </>} />
      <div className="space-y-5">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required htmlFor="t"><input id="t" className="field" value={c.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Host" htmlFor="h"><input id="h" className="field" value={c.host} onChange={(e) => set({ host: e.target.value })} /></Field>
            <Field label="Audience" htmlFor="tr"><select id="tr" className="field" value={c.track} onChange={(e) => set({ track: e.target.value as Campaign['track'] })}><option value="public">Public</option><option value="staff">CEDA staff only</option><option value="partner">Partner call</option></select></Field>
            <Field label="Status" htmlFor="st"><select id="st" className="field" value={c.status} onChange={(e) => set({ status: e.target.value as Campaign['status'] })}><option value="draft">Draft (hidden)</option><option value="open">Open for entries</option><option value="reviewing">Closed: reviewing</option><option value="closed">Closed</option></select></Field>
            <Field label="Opens" htmlFor="o"><input id="o" type="date" className="field" value={toLocal(c.opens)} onChange={(e) => set({ opens: new Date(e.target.value).toISOString() })} /></Field>
            <Field label="Closes" htmlFor="cl"><input id="cl" type="date" className="field" value={toLocal(c.closes)} onChange={(e) => set({ closes: new Date(e.target.value).toISOString() })} /></Field>
            <Field label="Maximum award (P)" htmlFor="ma"><input id="ma" type="number" className="field" value={c.maxAward} onChange={(e) => set({ maxAward: Number(e.target.value) })} /></Field>
            <Field label="Award pool (P)" htmlFor="ap"><input id="ap" type="number" className="field" value={c.awardPool} onChange={(e) => set({ awardPool: Number(e.target.value) })} /></Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Card summary" htmlFor="su"><input id="su" className="field" value={c.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
            <Field label="Full brief" htmlFor="br"><textarea id="br" className="field min-h-28" value={c.brief} onChange={(e) => set({ brief: e.target.value })} /></Field>
            <Field label="Eligibility rules (one per line)" htmlFor="el"><textarea id="el" className="field min-h-20" value={c.eligibility.join('\n')} onChange={(e) => set({ eligibility: e.target.value.split('\n') })} /></Field>
          </div>
        </Section>

        <Section title="Evaluation levels" sub="How many gates an idea passes through.">
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={c.levels.screening} onChange={(e) => set({ levels: { ...c.levels, screening: e.target.checked } })} /> Level 1 screening</label>
            <Field label="Reviewers per idea" htmlFor="rp"><input id="rp" type="number" min={1} max={7} className="field" value={c.levels.reviewersPerIdea} onChange={(e) => set({ levels: { ...c.levels, reviewersPerIdea: Number(e.target.value) } })} /></Field>
            <Field label="Disagreement flag (points)" htmlFor="dt"><input id="dt" type="number" className="field" value={c.levels.disagreementThreshold} onChange={(e) => set({ levels: { ...c.levels, disagreementThreshold: Number(e.target.value) } })} /></Field>
            <Field label="Committee quorum" htmlFor="q"><input id="q" type="number" min={1} className="field" value={c.levels.committeeQuorum} onChange={(e) => set({ levels: { ...c.levels, committeeQuorum: Number(e.target.value) } })} /></Field>
          </div>
        </Section>

        <Section title="Scoring criteria" sub="Reviewers score each from 1 to 5. Weights are shown to applicants as percentages." action={<Button size="sm" variant="secondary" onClick={() => set({ criteria: [...c.criteria, { id: uid('k'), name: 'New criterion', description: '', weight: 10 }] })}><Plus size={14} /> Criterion</Button>}>
          <div className="space-y-2">
            {c.criteria.map((cr, i) => (
              <div key={cr.id} className="grid items-center gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_2fr_90px_60px_auto]">
                <input className="field" value={cr.name} aria-label="Criterion name" onChange={(e) => set({ criteria: c.criteria.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <input className="field" value={cr.description} placeholder="What reviewers look for" aria-label="Description" onChange={(e) => set({ criteria: c.criteria.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} />
                <input type="number" className="field" value={cr.weight} min={1} aria-label="Weight" onChange={(e) => set({ criteria: c.criteria.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)) })} />
                <Badge tone="brand">{Math.round((cr.weight / total) * 100)}%</Badge>
                <button onClick={() => set({ criteria: c.criteria.filter((_, j) => j !== i) })} aria-label="Remove criterion" className="justify-self-end p-1 text-muted hover:text-rose-700"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Application form" sub="Mark questions as required to guarantee complete submissions." action={<Button size="sm" variant="secondary" onClick={() => set({ form: [...c.form, { id: uid('q'), label: 'New question', type: 'text', required: false }] })}><Plus size={14} /> Question</Button>}>
          <div className="space-y-2">
            {c.form.map((f, i) => (
              <div key={f.id} className="rounded-xl border border-line p-3">
                <div className="grid items-center gap-2 sm:grid-cols-[1fr_170px_auto_auto]">
                  <input className="field" value={f.label} aria-label="Question" onChange={(e) => setField(i, { label: e.target.value })} />
                  <select className="field" value={f.type} aria-label="Answer type" onChange={(e) => setField(i, { type: e.target.value as FieldType })}>{TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>
                  <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="accent-[var(--brand)]" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} /> Required</label>
                  <div className="flex gap-0.5 justify-self-end">
                    <button disabled={i === 0} onClick={() => set({ form: move(c.form, i, -1) })} aria-label="Move up" className="p-1 disabled:opacity-30"><ArrowUp size={15} /></button>
                    <button disabled={i === c.form.length - 1} onClick={() => set({ form: move(c.form, i, 1) })} aria-label="Move down" className="p-1 disabled:opacity-30"><ArrowDown size={15} /></button>
                    <button onClick={() => set({ form: c.form.filter((_, j) => j !== i) })} aria-label="Delete question" className="p-1 text-muted hover:text-rose-700"><Trash2 size={15} /></button>
                  </div>
                </div>
                {f.type === 'select' && <input className="field mt-2" placeholder="Options, separated by commas" value={(f.options ?? []).join(', ')} onChange={(e) => setField(i, { options: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} aria-label="Options" />}
                <input className="field mt-2" placeholder="Help text (optional)" value={f.help ?? ''} onChange={(e) => setField(i, { help: e.target.value })} aria-label="Help text" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Required documents" action={<Button size="sm" variant="secondary" onClick={() => set({ documents: [...c.documents, { id: uid('d'), name: 'New document', required: false, accept: '.pdf', maxMb: 5 }] })}><Plus size={14} /> Document</Button>}>
          <div className="space-y-2">
            {c.documents.map((d, i) => (
              <div key={d.id} className="grid items-center gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_140px_90px_auto_auto]">
                <input className="field" value={d.name} aria-label="Document name" onChange={(e) => set({ documents: c.documents.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <input className="field" value={d.accept} aria-label="Accepted types" onChange={(e) => set({ documents: c.documents.map((x, j) => (j === i ? { ...x, accept: e.target.value } : x)) })} />
                <input type="number" className="field" value={d.maxMb} aria-label="Max MB" onChange={(e) => set({ documents: c.documents.map((x, j) => (j === i ? { ...x, maxMb: Number(e.target.value) } : x)) })} />
                <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="accent-[var(--brand)]" checked={d.required} onChange={(e) => set({ documents: c.documents.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)) })} /> Required</label>
                <button onClick={() => set({ documents: c.documents.filter((_, j) => j !== i) })} aria-label="Remove document" className="p-1 text-muted hover:text-rose-700"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </Section>
        {!entries && <Button variant="danger" onClick={() => { if (attempt(() => deleteCampaign(me, c.id), 'Call deleted') !== undefined) nav('/app/admin/calls'); }}><Trash2 size={15} /> Delete this call</Button>}
      </div>
      <Modal open={preview} onClose={() => setPreview(false)} title={`Applicant view: ${c.title}`} wide>
        <div className="space-y-4">
          {c.form.map((f) => (
            <Field key={f.id} label={f.label} required={f.required} help={f.help}>
              {f.type === 'textarea' ? <textarea className="field" disabled /> : f.type === 'select' ? <select className="field" disabled><option>{f.options?.join(' / ')}</option></select> : f.type === 'checkbox' ? <label className="flex gap-2 text-sm"><input type="checkbox" disabled /> Yes, this is true</label> : <input className="field" disabled />}
            </Field>
          ))}
          {c.documents.map((d) => <div key={d.id} className="rounded-xl border border-dashed border-line p-3 text-sm">Upload: {d.name} {d.required && <span className="text-rose-600">*</span>} <span className="text-muted">({d.accept}, ≤{d.maxMb} MB)</span></div>)}
        </div>
      </Modal>
    </div>
  );
}
