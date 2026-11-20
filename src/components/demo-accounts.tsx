import { demoLogin } from '@/app/actions/auth';
import { Lightbulb, ClipboardList, Gavel, Eye, Headphones, SlidersHorizontal, Building2, ShieldCheck, Briefcase } from 'lucide-react';

export const DEMO = [
  { email: 'innovator@demo.ceda.bw', role: 'Innovator', who: 'Kagiso Molefe', does: 'Apply, track, reply to feedback, resubmit' },
  { email: 'evaluator@demo.ceda.bw', role: 'Evaluator', who: 'Dr Lesego Ntsima', does: 'Declare conflicts, score blind' },
  { email: 'panel@demo.ceda.bw', role: 'Adjudication panel', who: 'Onalenna Dube', does: 'Compare calibrated scores, vote, award' },
  { email: 'observer@demo.ceda.bw', role: 'Committee observer', who: 'Masego Phiri', does: 'Watch progress, read-only' },
  { email: 'consultant@demo.ceda.bw', role: 'CEDA consultant', who: 'Thato Keabetswe', does: 'Live chat, support tickets' },
  { email: 'admin@demo.ceda.bw', role: 'CEDA administrator', who: 'Neo Mothibi', does: 'Instances, screening, content, users, audit' },
  { email: 'partner@demo.ceda.bw', role: 'Partner admin (BDIH)', who: 'Boitumelo Sebele', does: 'Runs BDIH’s own Instance' },
  { email: 'super@demo.ceda.bw', role: 'Super administrator', who: 'Tebogo Kgosi', does: 'Everything, incl. look and settings' },
  { email: 'staff@demo.ceda.bw', role: 'CEDA staff innovator', who: 'Ame Lebotse', does: 'Staff-only intrapreneurship' },
];

const ICONS = [Lightbulb, ClipboardList, Gavel, Eye, Headphones, SlidersHorizontal, Building2, ShieldCheck, Briefcase];

export function DemoAccounts({ next, compact = false }: { next?: string; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
      {DEMO.map((a, n) => {
        const Icon = ICONS[n] ?? Lightbulb;
        return (
        <form key={a.email} action={demoLogin.bind(null, a.email, next ?? '/dashboard')}>
          <button className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-[var(--brand)] hover:bg-sand/50">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]"><Icon size={16} /></span>
            <span className="min-w-0"><span className="block text-[15px] font-medium">{a.role}</span><span className="block truncate text-[13px] text-muted">{a.who}: {a.does.charAt(0).toLowerCase() + a.does.slice(1)}</span></span>
          </button>
        </form>
        );
      })}
    </div>
  );
}
