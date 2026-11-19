import { and, asc, eq } from 'drizzle-orm';
import { ExternalLink } from 'lucide-react';
import { db, schema } from '@/db';
import { PageHeader } from '@/components/ui';
import { currentUser } from '@/lib/session';
import { getSetting } from '@/lib/settings';
import { REGULATORS } from '@/lib/catalogue';
import { SLA } from '@/lib/sla';
import { CHAT_HOURS } from '@/lib/hours';
import { TicketForm } from './ticket-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Help and FAQs' };

export default async function Help() {
  const me = await currentUser();
  const faqs = await db.select().from(schema.content).where(and(eq(schema.content.kind, 'faq'), eq(schema.content.published, true))).orderBy(asc(schema.content.sort));
  const docs = await db.select().from(schema.content).where(and(eq(schema.content.kind, 'document'), eq(schema.content.published, true))).orderBy(asc(schema.content.sort));
  const regulators = await getSetting<typeof REGULATORS>('regulators', REGULATORS);
  const groups = [...new Set(faqs.map((f) => f.category ?? 'General'))];
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="Help" title="Answers, people and turnaround times" sub={`Search the questions below, chat with a consultant (Monday to Friday, ${String(CHAT_HOURS.open).padStart(2, '0')}:00 to ${CHAT_HOURS.close}:00), or report a problem and get a reference with a deadline.`} />
      <nav className="mb-8 flex flex-wrap gap-2 text-sm">{[['#faq', 'Questions'], ['#regulators', 'Regulators'], ['#documents', 'Documents'], ['#turnaround', 'Turnaround times'], ['#support', 'Report a problem']].map(([h, l]) => <a key={h} href={h} className="chip border border-line bg-white !py-1.5">{l}</a>)}</nav>

      <section id="faq" className="mb-12 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold">Questions people ask</h2>
        {groups.map((g) => (
          <div key={g} className="mb-6"><h3 className="eyebrow mb-2">{g}</h3>
            <div className="card divide-y divide-line">{faqs.filter((f) => (f.category ?? 'General') === g).map((f) => <details key={f.id} id={`faq-${f.id}`} className="group scroll-mt-24 p-4"><summary className="cursor-pointer list-none font-semibold marker:hidden">{f.title}<span className="float-right text-muted transition group-open:rotate-45">+</span></summary><p className="mt-2 whitespace-pre-line text-sm text-muted">{f.body}</p></details>)}</div>
          </div>
        ))}
      </section>

      <section id="regulators" className="mb-12 scroll-mt-24">
        <h2 className="mb-1 text-2xl font-bold">Regulators you may need</h2>
        <p className="mb-4 text-sm text-muted">Many ideas need a licence or registration before they can trade. Start early. Links go to each regulator&apos;s own website.</p>
        <div className="grid gap-3 sm:grid-cols-2">{regulators.map((r) => <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="card block p-4 hover:border-[var(--brand)]"><div className="flex items-center justify-between font-bold">{r.name}<ExternalLink size={14} className="text-muted" /></div><div className="text-xs text-muted">{r.full}</div><p className="mt-1 text-sm">{r.why}</p></a>)}</div>
      </section>

      {docs.length > 0 && <section id="documents" className="mb-12 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold">Documents and guides</h2>
        <ul className="grid gap-3 sm:grid-cols-2">{docs.map((d) => <li key={d.id}><a href={d.url ?? '#'} className="card block p-4 hover:border-[var(--brand)]"><div className="text-xs text-muted">{d.category}</div><div className="font-bold">{d.title}</div><p className="text-sm text-muted">{d.body}</p></a></li>)}</ul>
      </section>}

      <section id="turnaround" className="mb-12 scroll-mt-24">
        <h2 className="mb-1 text-2xl font-bold">How fast we respond</h2>
        <p className="mb-4 text-sm text-muted">Every report gets a reference and two deadlines. Urgent problems run on a 24-hour clock; others count working hours only (Monday to Friday, 08:00 to 17:00, not on public holidays).</p>
        <div className="card overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="bg-sand/60 text-left text-xs uppercase text-muted"><tr><th className="p-3">Level</th><th className="p-3">Meaning</th><th className="p-3">First response</th><th className="p-3">Fixed within</th></tr></thead>
          <tbody className="divide-y divide-line">{Object.entries(SLA).map(([k, v]) => <tr key={k}><td className="p-3 font-bold">{k}</td><td className="p-3">{v.label}</td><td className="p-3">{v.respond} {v.clock === '24/7' ? 'hours' : 'working hours'}</td><td className="p-3">{v.resolve} {v.clock === '24/7' ? 'hours' : 'working hours'}</td></tr>)}</tbody></table></div>
      </section>

      <section id="support" className="card scroll-mt-24 p-6">
        <h2 className="mb-1 text-2xl font-bold">Report a problem</h2>
        <p className="mb-4 text-sm text-muted">You get a reference straight away and the deadlines for your case. No account needed.</p>
        <TicketForm name={me?.name} contact={me?.email} />
      </section>
    </div>
  );
}
