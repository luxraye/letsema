import { useStore, PageHeader } from '../../ui/kit';

export default function Privacy() {
  const s = useStore();
  const r = s.settings.retentionMonths;
  const items = [
    ['Lawful and fair', 'We collect your details with your recorded consent, to run the calls you enter. The consent date is stored on your account.'],
    ['Specific purpose', 'Your data is used only to evaluate, fund and support your idea, and to produce anonymised statistics.'],
    ['Minimal', 'We ask only for what the call needs. Reviewers see your idea without your name, company or district (blind review).'],
    ['Secure', 'Role-based access, encrypted transport and storage, passkey and one-time-code sign-in, and a tamper-evident audit trail of who did what.'],
    ['Kept only as long as needed', `Applications ${r.applications / 12} years; unsuccessful applications ${r.declined / 12} years; chat transcripts ${r.chat} months; audit records ${r.audit / 12} years. Then deleted or anonymised.`],
    ['Your rights', 'From your profile you can download all your data, ask for corrections, or ask for erasure. Erasure removes your personal details while keeping anonymous evaluation records intact.'],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader eyebrow="Privacy notice" title="How Letsema handles your data" sub="Written to meet Botswana’s Data Protection Act, 2024." />
      <div className="space-y-3">{items.map(([h, b]) => <div key={h} className="card p-5"><h2 className="font-bold">{h}</h2><p className="mt-1 text-ink/80">{b}</p></div>)}</div>
      <div className="card mt-6 p-5 text-sm"><b>Data protection contact.</b> CEDA’s Data Protection Officer handles requests within the time limits set by the Act. In this demo, requests appear on the administrator’s Data protection desk.</div>
    </div>
  );
}
