import Link from 'next/link';
import { Heart, BadgeCheck } from 'lucide-react';
import { PageHeader, Empty } from '@/components/ui';
import { showcase } from '@/lib/queries';
import { pula } from '@/lib/instances';
import { fmtDate } from '@/lib/format';
import { cheer } from '@/app/actions/entries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Funded innovators' };

export default async function Funded() {
  const rows = await showcase();
  const total = rows.reduce((s, r) => s + (r.e.awardAmount ?? 0), 0);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader eyebrow="Showcase" title="Ideas CEDA has backed" sub={`${rows.length} funded innovators who agreed to be shown here, ${pula(total)} in awards. Every award links to a code anyone can check.`} />
      {rows.length === 0 ? <Empty title="No awards shown yet" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map(({ e, instance }) => (
          <article key={e.id} id={e.ref} className="card flex scroll-mt-24 flex-col p-5">
            <div className="text-xs text-muted">{instance}</div>
            <h2 className="mt-1 text-lg font-bold">{e.title}</h2>
            <div className="mt-1 text-xs text-muted">{[e.sector, e.district].filter(Boolean).join(' · ')}</div>
            <p className="mt-3 flex-1 text-sm">{e.summary}</p>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
              <span className="font-bold text-emerald-700">{pula(e.awardAmount)}</span>
              {e.awardCode && <Link href={`/verify/${e.ref}/${e.awardCode}`} className="flex items-center gap-1 text-xs text-muted hover:underline"><BadgeCheck size={14} /> Verified {e.decidedAt ? fmtDate(e.decidedAt) : ''}</Link>}
              <form action={cheer.bind(null, e.id)}><button className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs hover:border-rose-300 hover:text-rose-600" aria-label={`Cheer for ${e.title}`}><Heart size={13} /> {e.cheers}</button></form>
            </div>
          </article>
        ))}</div>
      )}
    </div>
  );
}
