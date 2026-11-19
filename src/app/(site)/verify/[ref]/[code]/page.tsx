import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { BadgeCheck, XCircle } from 'lucide-react';
import { db, schema } from '@/db';
import { awardCode } from '@/lib/award';
import { pula } from '@/lib/instances';
import { fmtDate } from '@/lib/format';
import { safeEqual } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export default async function Result({ params }: { params: Promise<{ ref: string; code: string }> }) {
  const { ref, code } = await params;
  const R = decodeURIComponent(ref).toUpperCase(); const C = decodeURIComponent(code).toUpperCase();
  const [row] = await db.select({ e: schema.entries, i: schema.instances, u: schema.users }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).innerJoin(schema.users, eq(schema.users.id, schema.entries.innovatorId)).where(eq(schema.entries.ref, R)).limit(1);
  const ok = row && row.e.status === 'awarded' && row.e.awardAmount != null && safeEqual(awardCode(R, row.e.awardAmount), C);
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className={`card p-8 text-center ${ok ? 'border-emerald-300' : 'border-rose-300'}`}>
        {ok ? <BadgeCheck size={56} className="mx-auto text-emerald-600" /> : <XCircle size={56} className="mx-auto text-rose-600" />}
        <h1 className="mt-3 text-2xl font-extrabold">{ok ? 'Genuine CEDA award' : 'Not verified'}</h1>
        {ok ? (
          <dl className="mt-5 space-y-2 text-left text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Awarded to</dt><dd className="font-semibold">{row.u.erasedAt ? 'Withheld at the holder’s request' : row.u.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">For</dt><dd className="text-right font-semibold">{row.e.title}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Programme</dt><dd className="text-right">{row.i.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Amount</dt><dd className="font-semibold">{pula(row.e.awardAmount)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Date</dt><dd>{fmtDate(row.e.decidedAt)}</dd></div>
          </dl>
        ) : <p className="mt-2 text-muted">The reference and code do not match an award. Check for typos, or contact CEDA before relying on this certificate.</p>}
        <Link href="/verify" className="btn-ghost mt-6">Check another</Link>
      </div>
    </div>
  );
}
