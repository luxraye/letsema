import { demoLogin } from '@/app/actions/auth';
import { DEMO } from './demo-accounts';

export function RoleSwitcher({ current }: { current: string }) {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-lg border border-amber/50 bg-amber/10 px-2.5 py-1.5 text-xs font-bold text-copper">Switch role</summary>
      <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-xl">
        <div className="px-2 pb-1 text-xs text-muted">Demo only: jump to any role.</div>
        {DEMO.map((a) => (
          <form key={a.email} action={demoLogin.bind(null, a.email, '/dashboard')}>
            <button className={`w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sand ${a.email === current ? 'bg-sand font-bold' : ''}`}>{a.role} <span className="text-xs text-muted">· {a.who}</span></button>
          </form>
        ))}
      </div>
    </details>
  );
}
