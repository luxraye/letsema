import { demoLogin } from '@/app/actions/auth';
import { Avatar } from './ui';

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

export function DemoAccounts({ next, compact = false }: { next?: string; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
      {DEMO.map((a) => (
        <form key={a.email} action={demoLogin.bind(null, a.email, next ?? '/dashboard')}>
          <button className="flex w-full items-start gap-3 rounded-xl border border-line bg-white p-3 text-left transition hover:border-[var(--brand)] hover:bg-sand/50">
            <Avatar name={a.who} size={32} />
            <span className="min-w-0"><span className="block text-sm font-bold">{a.role}</span><span className="block truncate text-xs text-muted">{a.who} · {a.does}</span></span>
          </button>
        </form>
      ))}
    </div>
  );
}
