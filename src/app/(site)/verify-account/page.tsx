import { VerifyForm } from './form';
export const metadata = { title: 'Confirm your account' };
export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string; phone?: string }> }) {
  const { email = '', phone } = await searchParams;
  return (
    <div className="bg-sand/60 px-4 py-12">
      <div className="card mx-auto max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Confirm it’s you</h1>
        <p className="mb-6 mt-1 text-sm text-muted">We sent a 6-digit code{phone ? ' to your email and your phone' : ' to your email'}. Codes expire after 10 minutes.</p>
        <VerifyForm email={email} phone={phone} />
      </div>
    </div>
  );
}
