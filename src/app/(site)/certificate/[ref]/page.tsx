import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db, schema } from '@/db';
import { pula } from '@/lib/instances';
import { fmtDate } from '@/lib/format';
import { Logo } from '@/components/logo';
import { PrintButton } from '@/components/print-button';

export const dynamic = 'force-dynamic';
export default async function Certificate({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const [row] = await db.select({ e: schema.entries, i: schema.instances, u: schema.users }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).innerJoin(schema.users, eq(schema.users.id, schema.entries.innovatorId)).where(eq(schema.entries.ref, ref.toUpperCase())).limit(1);
  if (!row || row.e.status !== 'awarded' || !row.e.awardCode) notFound();
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const url = `${h.get('x-forwarded-proto') ?? 'https'}://${host}/verify/${row.e.ref}/${row.e.awardCode}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: '#2a1d18' } });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <div className="relative overflow-hidden rounded-3xl border-8 border-double border-amber/60 bg-cream p-10 text-center shadow-xl">
        <Logo />
        <div className="mt-6 text-xs font-bold uppercase tracking-[.3em] text-muted">Certificate of award</div>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{row.u.name}</h1>
        <p className="mt-3 text-muted">is awarded</p>
        <div className="mt-2 text-4xl font-bold text-[var(--brand)]">{pula(row.e.awardAmount)}</div>
        <p className="mx-auto mt-4 max-w-xl">for <b>{row.e.title}</b> in the <b>{row.i.name}</b>.</p>
        <div className="mt-8 grid items-end gap-6 sm:grid-cols-3">
          <div className="text-left text-xs"><div className="text-muted">Date</div><div className="font-semibold">{fmtDate(row.e.decidedAt)}</div><div className="mt-2 text-muted">Reference</div><div className="mono font-semibold">{row.e.ref}</div></div>
          <div><img src={qr} alt="QR code to verify this certificate" className="mx-auto size-32" /></div>
          <div className="text-right text-xs"><div className="text-muted">Verification code</div><div className="mono text-base font-bold">{row.e.awardCode}</div><div className="mt-1 text-muted">Scan or visit /verify</div></div>
        </div>
      </div>
    </div>
  );
}
