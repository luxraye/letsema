import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { ChevronDown, Search, Clock, LifeBuoy, Building, FileText } from 'lucide-react';
import { useStore, PageHeader } from '../../ui/kit';
import { availability } from '../../core/hours';

export const AUTHORITIES = [
  { name: 'Citizen Entrepreneurial Development Agency (CEDA)', what: 'Funding, mentoring, this portal', web: 'www.ceda.co.bw' },
  { name: 'Companies and Intellectual Property Authority (CIPA)', what: 'Company registration, trade marks, patents', web: 'www.cipa.co.bw' },
  { name: 'Botswana Unified Revenue Service (BURS)', what: 'Tax registration and clearance', web: 'www.burs.org.bw' },
  { name: 'Botswana Communications Regulatory Authority (BOCRA)', what: 'Telecoms, internet, postal and broadcasting', web: 'www.bocra.org.bw' },
  { name: 'Non-Bank Financial Institutions Regulatory Authority (NBFIRA)', what: 'Lending, insurance and other non-bank financial services', web: 'www.nbfira.org.bw' },
  { name: 'Botswana Bureau of Standards (BOBS)', what: 'Product standards and certification', web: 'www.bobstandards.bw' },
  { name: 'Competition and Consumer Authority', what: 'Fair competition and consumer protection', web: 'www.competitionauthority.co.bw' },
  { name: 'Botswana Innovation Hub', what: 'Innovation support, tech parks and programmes', web: 'www.bih.co.bw' },
];

export const SLA = [
  { sev: 'P1 · Critical', ex: 'Portal down, or data at risk', response: '30 minutes, 24/7', restore: '4 hours' },
  { sev: 'P2 · High', ex: 'A key feature fails (submission, scoring)', response: '2 working hours', restore: '1 working day' },
  { sev: 'P3 · Medium', ex: 'A feature is degraded with a workaround', response: '1 working day', restore: '3 working days' },
  { sev: 'P4 · Low', ex: 'Cosmetic issue or question', response: '2 working days', restore: 'Next release' },
];

export default function Help() {
  const s = useStore();
  const loc = useLocation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView(); }, [loc.hash]);
  const faqs = s.faqs.filter((f) => !q || `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase()));
  const cats = [...new Set(faqs.map((f) => f.category))];
  const av = availability(new Date(), s.settings.chat);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="Help" title="Questions, contacts and support" sub="Search the FAQs, chat with a consultant, or find the right authority." />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="relative mb-5"><Search size={16} className="absolute left-3 top-3 text-muted" /><input className="field pl-9" placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search FAQs" /></div>
          {cats.map((c) => (
            <section key={c} className="mb-6">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">{c}</h2>
              <div className="card divide-y divide-line">
                {faqs.filter((f) => f.category === c).map((f) => (
                  <div key={f.id}>
                    <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold" onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id}>
                      {f.q}<ChevronDown size={18} className={`shrink-0 transition ${open === f.id ? 'rotate-180' : ''}`} />
                    </button>
                    {open === f.id && <p className="px-4 pb-4 text-ink/80">{f.a}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
          {!faqs.length && <p className="text-muted">No matching questions. Try live chat.</p>}

          <section id="authorities" className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Building size={20} /> Regulatory authorities</h2>
            <p className="mt-1 text-sm text-muted">Who to contact for approvals your idea may need. Contact details are maintained by CEDA administrators.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {AUTHORITIES.map((a) => (
                <div key={a.name} className="card p-4"><div className="font-semibold">{a.name}</div><div className="text-sm text-muted">{a.what}</div><div className="mt-1 text-sm font-semibold text-brand">{a.web}</div></div>
              ))}
            </div>
          </section>

          <section id="support" className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-bold"><LifeBuoy size={20} /> Fault support & turnaround times</h2>
            <p className="mt-1 text-sm text-muted">How quickly the supplier responds to and fixes faults while hosting the portal. Report faults through live chat, the service desk email, or the status page.</p>
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper text-left"><tr><th className="p-3">Severity</th><th className="p-3">Example</th><th className="p-3">First response</th><th className="p-3">Restore target</th></tr></thead>
                <tbody>{SLA.map((r) => <tr key={r.sev} className="border-t border-line"><td className="p-3 font-semibold">{r.sev}</td><td className="p-3">{r.ex}</td><td className="p-3">{r.response}</td><td className="p-3">{r.restore}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">Working hours: 08:00–17:00, Monday to Friday (CAT). P1 is covered 24/7 by on-call engineers. Monthly availability target 99.9%. Every incident gets a written report within 5 working days.</p>
          </section>
        </div>
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 font-bold"><Clock size={18} className="text-brand" /> Live chat</div>
            <p className="mt-2 text-sm">{s.settings.chat.open}–{s.settings.chat.close}, Monday to Friday, except public holidays.</p>
            <p className={`mt-2 rounded-lg px-3 py-2 text-sm font-semibold ${av.open ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>{av.open ? 'Open now' : 'Closed now'} · {av.local}</p>
            <p className="mt-2 text-xs text-muted">Use the chat button at the bottom right of any page.</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 font-bold"><FileText size={18} className="text-brand" /> Guides & templates</div>
            <ul className="mt-3 space-y-2 text-sm">{s.documents.filter((d) => !d.campaignId).map((d) => <li key={d.id}>{d.name}</li>)}</ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
