import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui';
export const metadata = { title: 'Verify an award' };
export default async function Verify({ searchParams }: { searchParams: Promise<{ ref?: string; code?: string }> }) {
  const { ref, code } = await searchParams;
  if (ref && code) redirect(`/verify/${encodeURIComponent(ref.trim().toUpperCase())}/${encodeURIComponent(code.trim().toUpperCase())}`);
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <PageHeader eyebrow="Anyone can check" title="Verify an award" sub="Banks, partners and suppliers can confirm a CEDA award is real using the reference and code on the certificate." />
      <form className="card space-y-4 p-6">
        <div><label className="label" htmlFor="ref">Reference</label><input id="ref" name="ref" className="field mono uppercase" placeholder="CEDA-26-0103" required /></div>
        <div><label className="label" htmlFor="code">Verification code</label><input id="code" name="code" className="field mono uppercase" placeholder="XXXX-XXXX" required /></div>
        <button className="btn-primary w-full">Verify</button>
      </form>
    </div>
  );
}
