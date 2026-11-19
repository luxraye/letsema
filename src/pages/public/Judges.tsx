import { useNavigate } from 'react-router';
import { ArrowRight, MonitorSmartphone } from 'lucide-react';
import { PageHeader, Avatar, Badge } from '../../ui/kit';
import { DEMO_ACCOUNTS } from '../../ui/layout';
import { demoLogin, logout } from '../../core/actions';

type Row = { item: string; where: string; as?: string; to: string };
const MAP: { group: string; points: number; rows: Row[] }[] = [
  { group: 'General', points: 15, rows: [
    { item: 'CEDA directs layout, colours and fonts', where: 'Look & settings: pick a preset (CEDA sunrise) or set colours, font and corner style; applies instantly everywhere', as: 'u_admin', to: '/app/admin/settings' },
    { item: 'Browser access (Edge, Chrome, Firefox, Safari)', where: 'Plain web app, no plug-ins; installable and works offline', to: '/' },
    { item: 'Self-registration with email or phone validation', where: 'Create account; a code goes to the demo inbox', to: '/register' },
    { item: 'Password, one-time code (SMS/email) and biometrics', where: 'Sign in: three tabs. Add a passkey (fingerprint/face) in Profile', to: '/login' },
    { item: 'Create, change and recover passwords', where: 'Forgot password; change it in Profile', to: '/forgot' },
    { item: 'Cloud provider, data region, storage costs; 24/7', where: 'Status & hosting', to: '/status' },
  ] },
  { group: 'Functionality', points: 20, rows: [
    { item: 'Admins upload, modify, delete content and the application form', where: 'Content (pages, FAQs, documents, notices) and Calls & forms (form builder)', as: 'u_admin', to: '/app/admin/calls' },
    { item: 'Multi-level evaluation with customisable criteria and adjudication', where: 'Screening, blind review, calibrated committee vote', as: 'u_reviewer', to: '/app/review' },
    { item: 'Feedback and iteration', where: 'Innovator idea page: feedback thread, revision, version diff', as: 'u_innovator', to: '/app/ideas' },
    { item: 'Live chat: multi-agent, hours, offline messages, analytics', where: 'Chat button (any page) and the consultant console', as: 'u_consultant', to: '/app/chat' },
    { item: 'Fault support and turnaround times', where: 'Help › Fault support', to: '/help#support' },
    { item: 'FAQs and regulatory-authority contacts', where: 'Help', to: '/help' },
    { item: 'Reporting dashboards: participation, outcomes, timelines', where: 'Reports (CSV export)', as: 'u_committee', to: '/app/reports' },
    { item: 'Free alerts when a submission is updated', where: 'Public tracker (no sign-in) and Profile › Alerts', to: '/track/LTS-26-0101' },
  ] },
  { group: 'Technical', points: 25, rows: [
    { item: 'Role-based access', where: 'Users & roles: live permission matrix; add a new role without code', as: 'u_admin', to: '/app/admin/users' },
    { item: 'Response time', where: 'Status page measures it live; lazy-loaded pages, tiny first load', to: '/status' },
    { item: 'Audit trail', where: 'Hash-chained trail with a “verify chain” and tamper test', as: 'u_admin', to: '/app/audit' },
    { item: 'Cyber security and data privacy', where: 'Data protection desk, consent, export/erase, lockout, blind review', as: 'u_admin', to: '/app/privacy' },
  ] },
];

export default function Judges() {
  const nav = useNavigate();
  const go = (r: { as?: string; to: string }) => { if (r.as) demoLogin(r.as); else logout(); nav(r.to); };
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="For the judging panel" title="See every criterion in under ten minutes" sub="Each row opens the exact screen, signed in as the right role. Nothing needs a real email or phone: codes arrive in the demo inbox." />
      <div className="card mb-8 p-5">
        <div className="flex items-center gap-2 font-bold"><MonitorSmartphone size={18} className="text-brand" /> Best demo of real-time tracking</div>
        <p className="mt-1 text-sm text-muted">Open this site in two browser tabs. In tab 1 sign in as the <b>Reviewer</b> and score an idea; in tab 2 sign in as the <b>Innovator</b> or <b>Committee</b>. Status changes, notifications and chat messages appear in the other tab instantly.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_ACCOUNTS.slice(0, 6).map((a) => (
          <button key={a.id} onClick={() => go({ as: a.id, to: '/app' })} className="card flex items-start gap-3 p-4 text-left transition hover:border-brand">
            <Avatar name={a.who} size={36} />
            <span><span className="block font-bold">{a.role}</span><span className="text-xs text-muted">{a.does}</span></span>
          </button>
        ))}
      </div>
      <div className="mt-10 space-y-8">
        {MAP.map((g) => (
          <section key={g.group}>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">{g.group} <Badge tone="brand">{g.points} pts</Badge></h2>
            <div className="card divide-y divide-line">
              {g.rows.map((r) => (
                <button key={r.item} onClick={() => go(r)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-brand-soft/50">
                  <div className="min-w-0 flex-1"><div className="font-semibold">{r.item}</div><div className="text-sm text-muted">{r.where}</div></div>
                  {r.as && <span className="hidden text-xs text-muted sm:block">as {DEMO_ACCOUNTS.find((a) => a.id === r.as)?.role}</span>}
                  <ArrowRight size={16} className="shrink-0 text-brand" />
                </button>
              ))}
            </div>
          </section>
        ))}
        <section className="card p-5">
          <h2 className="text-xl font-bold">Beyond the brief (Innovation & creativity)</h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {[
              'Reviewer calibration: removes harsh/lenient-marker bias',
              'Disagreement flags push contested ideas to discussion',
              'Duplicate-idea detector while you type (runs on-device)',
              'Side-by-side version diff on resubmission',
              'Milestone-linked funding tranches after award',
              'Staff-only intrapreneurship campaigns',
              'Partner calls on the same platform',
              'Live public pipeline on the home page',
              'Setswana menus, text size, contrast, dyslexia font, read-aloud',
              'Works offline; drafts never lost on a weak connection',
              'Passkeys (fingerprint/face) sign-in',
              'Receipts and award codes anyone can verify',
            ].map((x) => <li key={x} className="flex gap-2"><span className="text-brand">✦</span>{x}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
