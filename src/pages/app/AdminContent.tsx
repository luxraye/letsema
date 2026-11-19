import { useState } from 'react';
import { Pencil, Plus, Trash2, Upload, FileText } from 'lucide-react';
import { useMe, useStore, PageHeader, Tabs, Button, Field, Modal, attempt, Badge } from '../../ui/kit';
import { deleteDocument, deleteFaq, deletePage, saveFaq, saveNotice, savePage, uploadDocument } from '../../core/actions';
import { sha256Bytes } from '../../core/sha256';
import { fmtDate, uid } from '../../core/util';
import type { Faq, Notice, Page } from '../../core/types';

export default function AdminContent() {
  const me = useMe()!;
  const s = useStore();
  const [tab, setTab] = useState<'pages' | 'faqs' | 'documents' | 'notices'>('faqs');
  const [page, setPage] = useState<Page | null>(null);
  const [faq, setFaq] = useState<Faq | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [purpose, setPurpose] = useState('Template to accompany applications');
  const [docCall, setDocCall] = useState('');
  const onUpload = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return attempt(() => { throw new Error('Max 5 MB in the demo.'); });
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf[0] === 0x4d && buf[1] === 0x5a) return attempt(() => { throw new Error('Executable files are not allowed.'); });
    const dataUrl = file.size < 400_000 ? await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(file); }) : undefined;
    attempt(() => uploadDocument(me, { id: uid('doc'), name: file.name, size: file.size, type: file.type, sha256: sha256Bytes(buf), purpose, campaignId: docCall || undefined, uploadedAt: new Date().toISOString(), dataUrl }), `${file.name} uploaded`);
  };
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Content" sub="Upload, edit and delete everything applicants read: pages, FAQs, forms’ supporting documents and site notices. Every change is audited." />
      <Tabs value={tab} onChange={setTab} items={[{ key: 'faqs', label: `FAQs (${s.faqs.length})` }, { key: 'pages', label: `Pages (${s.pages.length})` }, { key: 'documents', label: `Documents (${s.documents.length})` }, { key: 'notices', label: 'Notices' }]} />
      <div className="mt-5">
        {tab === 'faqs' && (<>
          <Button className="mb-3" onClick={() => setFaq({ id: uid('faq'), q: '', a: '', category: 'Applying' })}><Plus size={15} /> Add FAQ</Button>
          <div className="card divide-y divide-line">{s.faqs.map((f) => (
            <div key={f.id} className="flex items-start gap-3 px-4 py-3"><Badge>{f.category}</Badge><div className="min-w-0 flex-1"><div className="font-semibold">{f.q}</div><div className="line-clamp-1 text-sm text-muted">{f.a}</div></div>
              <button onClick={() => setFaq(f)} aria-label="Edit"><Pencil size={16} /></button><button onClick={() => attempt(() => deleteFaq(me, f.id), 'FAQ deleted')} aria-label="Delete" className="text-rose-700"><Trash2 size={16} /></button></div>
          ))}</div>
        </>)}
        {tab === 'pages' && (<>
          <Button className="mb-3" onClick={() => setPage({ id: uid('pg'), slug: '', title: '', body: '', updatedAt: '' })}><Plus size={15} /> Add page</Button>
          <div className="card divide-y divide-line">{s.pages.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><div className="font-semibold">{p.title}</div><div className="text-xs text-muted">/page/{p.slug} · updated {fmtDate(p.updatedAt)}</div></div>
              <button onClick={() => setPage(p)} aria-label="Edit"><Pencil size={16} /></button><button onClick={() => attempt(() => deletePage(me, p.id), 'Page deleted')} aria-label="Delete" className="text-rose-700"><Trash2 size={16} /></button></div>
          ))}</div>
        </>)}
        {tab === 'documents' && (<>
          <div className="card mb-4 grid items-end gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="Purpose" htmlFor="pu"><input id="pu" className="field" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
            <Field label="Attach to call (optional)" htmlFor="dc"><select id="dc" className="field" value={docCall} onChange={(e) => setDocCall(e.target.value)}><option value="">All calls</option>{s.campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"><Upload size={16} /> Upload file<input type="file" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} /></label>
          </div>
          <div className="card divide-y divide-line">{s.documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3"><FileText size={18} className="text-brand" /><div className="min-w-0 flex-1"><div className="font-semibold">{d.dataUrl ? <a href={d.dataUrl} download={d.name} className="hover:underline">{d.name}</a> : d.name}</div><div className="text-xs text-muted">{d.purpose}{d.campaignId ? ` · ${s.campaigns.find((c) => c.id === d.campaignId)?.title}` : ''} · {(d.size / 1024).toFixed(0)} KB · sha256 {d.sha256.slice(0, 10)}…</div></div>
              <button onClick={() => attempt(() => deleteDocument(me, d.id), 'Document deleted')} aria-label="Delete" className="text-rose-700"><Trash2 size={16} /></button></div>
          ))}</div>
        </>)}
        {tab === 'notices' && (<>
          <Button className="mb-3" onClick={() => setNotice({ id: uid('nt'), title: '', body: '', tone: 'info', active: true, at: new Date().toISOString() })}><Plus size={15} /> New notice</Button>
          <div className="card divide-y divide-line">{s.notices.map((n) => (
            <div key={n.id} className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><div className="font-semibold">{n.title}</div><div className="text-sm text-muted">{n.body}</div></div>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="accent-[var(--brand)]" checked={n.active} onChange={(e) => attempt(() => saveNotice(me, { ...n, active: e.target.checked }), e.target.checked ? 'Notice shown' : 'Notice hidden')} /> Shown</label>
              <button onClick={() => setNotice(n)} aria-label="Edit"><Pencil size={16} /></button></div>
          ))}</div>
        </>)}
      </div>

      <Modal open={!!faq} onClose={() => setFaq(null)} title="FAQ">
        {faq && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (attempt(() => saveFaq(me, faq), 'FAQ saved') !== undefined) setFaq(null); }}>
          <Field label="Category" htmlFor="fc"><input id="fc" className="field" value={faq.category} onChange={(e) => setFaq({ ...faq, category: e.target.value })} /></Field>
          <Field label="Question" required htmlFor="fq"><input id="fq" className="field" value={faq.q} onChange={(e) => setFaq({ ...faq, q: e.target.value })} /></Field>
          <Field label="Answer" required htmlFor="fa"><textarea id="fa" className="field min-h-28" value={faq.a} onChange={(e) => setFaq({ ...faq, a: e.target.value })} /></Field>
          <Button type="submit" disabled={!faq.q.trim() || !faq.a.trim()}>Save</Button>
        </form>}
      </Modal>
      <Modal open={!!page} onClose={() => setPage(null)} title="Page" wide>
        {page && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const p = { ...page, slug: page.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') }; if (attempt(() => savePage(me, p), 'Page saved') !== undefined) setPage(null); }}>
          <Field label="Title" required htmlFor="pt"><input id="pt" className="field" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} /></Field>
          <Field label="Web address" htmlFor="ps" help="Leave blank to generate from the title"><input id="ps" className="field" value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })} /></Field>
          <Field label="Body" htmlFor="pb" help="Blank lines start new paragraphs."><textarea id="pb" className="field min-h-48" value={page.body} onChange={(e) => setPage({ ...page, body: e.target.value })} /></Field>
          <Button type="submit" disabled={!page.title.trim()}>Save</Button>
        </form>}
      </Modal>
      <Modal open={!!notice} onClose={() => setNotice(null)} title="Site notice">
        {notice && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (attempt(() => saveNotice(me, notice), 'Notice saved') !== undefined) setNotice(null); }}>
          <Field label="Title" htmlFor="nt"><input id="nt" className="field" value={notice.title} onChange={(e) => setNotice({ ...notice, title: e.target.value })} /></Field>
          <Field label="Message" htmlFor="nb"><input id="nb" className="field" value={notice.body} onChange={(e) => setNotice({ ...notice, body: e.target.value })} /></Field>
          <Field label="Style" htmlFor="ntone"><select id="ntone" className="field" value={notice.tone} onChange={(e) => setNotice({ ...notice, tone: e.target.value as Notice['tone'] })}><option value="info">Information</option><option value="success">Good news</option><option value="warning">Warning</option></select></Field>
          <Button type="submit" disabled={!notice.title.trim()}>Save</Button>
        </form>}
      </Modal>
    </div>
  );
}
