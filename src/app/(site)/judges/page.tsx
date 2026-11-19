import Link from 'next/link';
import { ArrowRight, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { HACKATHON_RUBRIC } from '@/lib/catalogue';
import { demoLogin } from '@/app/actions/auth';

export const metadata = { title: 'For the judging panel' };

type Shot = { what: string; href: string; as?: string };
const MAP: Record<string, Shot[]> = {
  general: [
    { what: 'CEDA look, and admins can restyle it with no code (colours, font, corners, presets)', href: '/dashboard/settings', as: 'admin' },
    { what: 'Self-registration with checks on every field, then a code by email or SMS', href: '/register' },
    { what: 'Sign in by password, one-time code, or fingerprint and face (passkeys)', href: '/login' },
    { what: 'Forgot password, with a code and sign-out everywhere', href: '/forgot' },
    { what: 'Hosting, live speed and uptime, and where the data lives', href: '/status' },
  ],
  functionality: [
    { what: 'Admins change content, FAQs, notices and documents', href: '/dashboard/content', as: 'admin' },
    { what: 'Admins design the form, rubric, stages and prizes of each competition (Instance Studio)', href: '/dashboard/instances', as: 'admin' },
    { what: 'Multi-level evaluation: screening, blind scoring, then a panel vote', href: '/dashboard/screening', as: 'admin' },
    { what: 'Feedback and changes: an application sent back, updated, with a word-by-word diff', href: '/dashboard/entries', as: 'innovator' },
    { what: 'Live chat with working hours, holidays and an out-of-hours message', href: '/dashboard/chat', as: 'consultant' },
    { what: 'Support tickets with response and fix deadlines', href: '/help#support' },
    { what: 'FAQs and links to regulators', href: '/help' },
    { what: 'Reports on participation, outcomes, timelines and evaluator fairness', href: '/dashboard/reports', as: 'admin' },
    { what: 'Free email and SMS alerts on any reference, no account needed', href: '/track' },
  ],
  ux: [
    { what: 'The whole journey on one page, in plain words', href: '/how-it-works' },
    { what: 'Am I eligible? in 30 seconds', href: '/eligibility' },
    { what: 'Larger text, high contrast and Setswana menus (the A icon in the header)', href: '/' },
  ],
  technical: [
    { what: 'Eight roles with a permission matrix; admins cannot score or vote', href: '/dashboard/users', as: 'admin' },
    { what: 'Tamper-evident audit trail, verified live, with a tamper demo', href: '/dashboard/audit', as: 'super' },
    { what: 'Anyone can check the audit chain is unbroken', href: '/api/audit/verify' },
    { what: 'Privacy desk: export or erase your data, with legal deadlines', href: '/dashboard/privacy', as: 'admin' },
    { what: 'API for partners, with keys that are stored only as a fingerprint', href: '/api/v1' },
  ],
  innovation: [
    { what: 'Instances: one engine runs calls, hackathons and accelerators for CEDA and its partners', href: '/instances' },
    { what: 'Sealed receipts and award certificates anyone can verify', href: '/verify' },
    { what: 'Evaluator calibration so a harsh marker cannot sink an idea', href: '/dashboard/reports', as: 'admin' },
    { what: 'Community forum for innovators, and a showcase of funded ideas', href: '/community' },
  ],
  presentation: [
    { what: 'Start here: CEDA’s four jobs, one place for each', href: '/#four-jobs' },
  ],
};

export default function Judges() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="For the judging panel" title="Every scoring criterion, one click away" sub="Each line opens the screen that shows it. Lines marked with a role sign you in as that demo account first, in one click." />
      <div className="card mb-8 flex flex-wrap items-center gap-3 p-4 text-sm"><KeyRound size={18} className="text-[var(--brand)]" /><span>Accounts: <b className="mono">innovator@demo.ceda.bw</b>, <b className="mono">evaluator@</b>, <b className="mono">panel@</b>, <b className="mono">consultant@</b>, <b className="mono">admin@</b>, <b className="mono">super@</b> and more. Password <b className="mono">CedaDemo2026!</b>. The sign-in page also has one-click demo buttons.</span><Link href="/login" className="btn-primary ml-auto !py-2">Sign in</Link></div>
      <ol className="space-y-6">
        {HACKATHON_RUBRIC.map((c, n) => (
          <li key={c.key} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-bold">{n + 1}. {c.label}</h2><span className="chip bg-[var(--brand)]/10 text-[var(--brand)]">{c.weight}%</span></div>
            <p className="mb-3 text-sm text-muted">{c.guide}</p>
            <ul className="divide-y divide-line">{(MAP[c.key] ?? []).map((s) => (
              <li key={s.what}>{s.as
                ? <form action={demoLogin.bind(null, `${s.as}@demo.ceda.bw`, s.href)}><button className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:text-[var(--brand)]"><span className="flex-1">{s.what}</span><span className="chip bg-sand text-xs">opens as {s.as}</span><ArrowRight size={15} /></button></form>
                : <Link href={s.href} className="flex items-center gap-3 py-2.5 text-sm hover:text-[var(--brand)]"><span className="flex-1">{s.what}</span><ArrowRight size={15} /></Link>}</li>
            ))}</ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
