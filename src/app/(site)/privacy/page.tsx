import Link from 'next/link';
import { PageHeader } from '@/components/ui';

export const metadata = { title: 'Privacy notice' };

const SECTIONS: [string, string[]][] = [
  ['What we collect', ['Your name, email, mobile number and, if a competition asks for it, your Omang number and date of birth to check eligibility.', 'What you write in applications and the files you upload.', 'Messages you send to CEDA, and a record of what you do on the portal (for example, submitting or signing in) with the time and network address.']],
  ['Why we use it', ['To run the competitions you enter: check eligibility, evaluate, decide and pay awards.', 'To talk to you about your application and send the alerts you asked for.', 'To keep the portal safe and to show, if ever questioned, that every decision was fair.']],
  ['Who can see it', ['CEDA staff who run the competition. Evaluators see your answers and files but not your name.', 'Partners such as BDIH or BTC only for their own competitions.', 'The public sees only your reference, its status and, if you are funded and agree, a short showcase entry.', 'We do not sell your data or use it for advertising.']],
  ['How long we keep it', ['Applications and their audit records are kept for the life of the programme and as long as the law requires for public funding records.', 'Drafts you never submit can be deleted by you at any time.', 'If you ask us to erase your account, we remove your name and contact details. The anonymous audit records stay so past decisions can still be checked.']],
  ['Your rights', ['Get a copy of your data. You can download it yourself from Profile and security.', 'Ask us to correct anything that is wrong.', 'Ask us to erase your data, subject to records the law makes us keep.', 'We answer every request within 30 days, and you can complain to the data protection regulator if you are unhappy with our answer.']],
  ['How we protect it', ['All traffic is encrypted. Passwords are stored only as a one-way hash.', 'Each role sees only what it needs, and every access to an application is recorded.', 'Files are checked when uploaded, and stored in the database, not on public links.']],
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader eyebrow="Trust" title="Privacy notice" sub="How the CEDA Innovation Portal uses your personal data, in plain words, under Botswana’s Data Protection Act 2024." />
      <div className="space-y-6">{SECTIONS.map(([h, items]) => <section key={h} className="card p-5"><h2 className="mb-2 text-lg font-bold">{h}</h2><ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">{items.map((i) => <li key={i}>{i}</li>)}</ul></section>)}</div>
      <p className="mt-6 text-sm">To make a request, sign in and open <Link className="font-semibold text-[var(--brand)]" href="/dashboard/profile">Profile and security</Link>, or <Link className="font-semibold text-[var(--brand)]" href="/help#support">contact support</Link>.</p>
      <p className="mt-2 text-xs text-muted">This is a hackathon prototype. CEDA&apos;s own legal team would confirm the final wording.</p>
    </div>
  );
}
