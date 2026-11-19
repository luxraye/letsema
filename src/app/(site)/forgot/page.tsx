import { ForgotForm } from './form';
export const metadata = { title: 'Reset password' };
export default function Page() {
  return (
    <div className="bg-sand/60 px-4 py-12">
      <div className="card mx-auto max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mb-6 mt-1 text-sm text-muted">We send a code to your email or phone.</p>
        <ForgotForm />
      </div>
    </div>
  );
}
