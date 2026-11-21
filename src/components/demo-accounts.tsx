import { demoLogin } from '@/app/actions/auth';
import { ArrowRight, ChevronDown, Rocket, Landmark, Handshake, Lightbulb, ClipboardList, Gavel, Eye, SlidersHorizontal, Building2, ShieldCheck } from 'lucide-react';

export const DEMO = [
  { email: 'innovator@demo.ceda.bw', role: 'Innovator', who: 'Kagiso Molefe', does: 'Apply, track, reply to feedback, resubmit' },
  { email: 'evaluator@demo.ceda.bw', role: 'Evaluator', who: 'Dr Lesego Ntsima', does: 'Declare conflicts, score blind' },
  { email: 'panel@demo.ceda.bw', role: 'Adjudication panel', who: 'Onalenna Dube', does: 'Compare scores, vote, award' },
  { email: 'observer@demo.ceda.bw', role: 'Committee observer', who: 'Masego Phiri', does: 'Watch progress, read-only' },
  { email: 'admin@demo.ceda.bw', role: 'CEDA administrator', who: 'Neo Mothibi', does: 'Set up competitions, screen, message applicants, live chat, audit' },
  { email: 'partner@demo.ceda.bw', role: 'Partner admin (BDIH)', who: 'Boitumelo Sebele', does: 'Runs BDIH’s own competitions' },
  { email: 'super@demo.ceda.bw', role: 'Super administrator', who: 'Tebogo Kgosi', does: 'Change the look and settings with no code' },
];

const ICONS: Record<string, typeof Lightbulb> = {
  innovator: Lightbulb, evaluator: ClipboardList, panel: Gavel, observer: Eye,
  admin: SlidersHorizontal, partner: Building2, super: ShieldCheck,
};

/** Three plain-language groups, so a visitor picks a side first and a role second. */
export const DEMO_GROUPS = [
  { id: 'innovators', title: 'Innovators', sub: 'Apply for funding and follow your idea', icon: Rocket, emails: ['innovator'] },
  { id: 'ceda', title: 'CEDA team', sub: 'Run competitions, score, award and support', icon: Landmark, emails: ['admin', 'evaluator', 'panel', 'super'] },
  { id: 'partners', title: 'Partners and observers', sub: 'Partner programmes and read-only oversight', icon: Handshake, emails: ['partner', 'observer'] },
];

const byKey = (k: string) => DEMO.find((a) => a.email.startsWith(`${k}@`))!;

function RoleButton({ k, next }: { k: string; next?: string }) {
  const a = byKey(k);
  const Icon = ICONS[k] ?? Lightbulb;
  return (
    <form className="min-w-0" action={demoLogin.bind(null, a.email, next ?? '/dashboard')}>
      <button className="group/role flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-[var(--brand)] hover:bg-sand/50 focus-visible:outline-2 focus-visible:outline-[var(--brand)]">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]"><Icon size={16} /></span>
        <span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{a.role}</span><span className="block text-[13px] leading-snug text-muted">{a.who}: {a.does.charAt(0).toLowerCase() + a.does.slice(1)}</span></span>
        <ArrowRight size={16} className="shrink-0 text-muted transition group-hover/role:translate-x-0.5 group-hover/role:text-[var(--brand)]" aria-hidden />
      </button>
    </form>
  );
}

/** Grouped picker: three dropdowns (only one open at a time), each listing its roles. Works with no JavaScript. */
export function DemoAccounts({ next }: { next?: string; compact?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {DEMO_GROUPS.map((g) => (
        <details key={g.id} name="demo-role-group" data-group={g.id} className="role-group group min-w-0 rounded-2xl border border-line bg-surface/60 transition open:border-[var(--brand)]/50 open:bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-3.5 focus-visible:outline-2 focus-visible:outline-[var(--brand)] [&::-webkit-details-marker]:hidden">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--t-brand-2,var(--brand))] text-white shadow-sm"><g.icon size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">{g.title}</span><span className="block text-[13px] leading-snug text-muted">{g.sub}</span></span>
            <span className="chip hidden shrink-0 bg-sand sm:inline-flex text-[11px] text-muted">{g.emails.length} {g.emails.length === 1 ? 'role' : 'roles'}</span>
            <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="grid gap-2 px-3 pb-3">
            {g.emails.map((k) => <RoleButton key={k} k={k} next={next} />)}
          </div>
        </details>
      ))}
    </div>
  );
}
