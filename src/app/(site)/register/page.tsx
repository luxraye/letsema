import Link from 'next/link';
import { RegisterForm } from './form';
export const metadata = { title: 'Create account' };
export default function Page() {
  return (
    <div className="bg-sand/60 px-4 py-12">
      <div className="card mx-auto max-w-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Create your free account</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Already have one? <Link href="/login" className="font-semibold text-[var(--brand)]">Sign in</Link>.</p>
        <RegisterForm />
      </div>
    </div>
  );
}
