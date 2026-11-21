import Link from 'next/link';
import { LogoMark } from '@/components/logo';
import { LoginForms } from './login-forms';
import { DemoAccounts } from '@/components/demo-accounts';
import { demoMode } from '@/lib/notify';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="bg-sand">
      <div className="mx-auto grid max-w-[56rem] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center"><LogoMark className="mx-auto size-11" /><h1 className="mt-3 text-2xl font-semibold">Sign in</h1><p className="mt-1 text-sm text-muted">CEDA Innovation Portal</p></div>
          <LoginForms next={sp.next ?? '/dashboard'} notice={sp.reset ? 'Password changed. Sign in with your new password.' : undefined} />
          <p className="mt-6 text-center text-sm text-muted">New innovator? <Link href="/register" className="font-medium text-[var(--brand)]">Create an account</Link></p>
        </div>
        {demoMode() && (
          <div className="card min-w-0 p-6">
            <h2 className="text-lg font-semibold">Try it as any role</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Pick a side, then a role. You go straight in, no typing needed. Password if you sign in by hand: <code className="mono rounded bg-sand px-1.5 py-0.5 text-xs font-bold text-fg">CedaDemo2026!</code></p>
            <DemoAccounts next={sp.next} />
            <p className="mt-4 text-sm text-muted">New to the evaluation walkthrough? <Link href="/judges" className="font-medium text-[var(--brand)]">How to judge this portal (each criterion, one click)</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
