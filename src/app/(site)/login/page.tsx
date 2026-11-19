import Link from 'next/link';
import { LoginForms } from './login-forms';
import { DemoAccounts } from '@/components/demo-accounts';
import { demoMode } from '@/lib/notify';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="bg-sand/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold">Sign in</h1>
          <p className="mb-6 mt-1 text-sm text-muted">New here? <Link href="/register" className="font-semibold text-[var(--brand)]">Create a free account</Link>.</p>
          <LoginForms next={sp.next ?? '/dashboard'} notice={sp.reset ? 'Password changed. Sign in with your new password.' : undefined} />
        </div>
        {demoMode() && (
          <div>
            <div className="eyebrow mb-3">Demo accounts</div>
            <h2 className="text-xl font-bold">Try any role in one click</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Every demo account also signs in with its email and the password <code className="mono rounded bg-white px-1.5 py-0.5">CedaDemo2026!</code></p>
            <DemoAccounts next={sp.next} />
          </div>
        )}
      </div>
    </div>
  );
}
