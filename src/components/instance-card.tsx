import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { schema } from '@/db';
import { currentStage, prizePool, pula } from '@/lib/instances';
import { fmtDate } from '@/lib/format';

type Row = { i: typeof schema.instances.$inferSelect; space: typeof schema.spaces.$inferSelect; entries: number };

export function InstanceCard({ x }: { x: Row }) {
  const st = currentStage(x.i.definition);
  const accepting = x.i.status === 'live' && st.stage && ['apply', 'register', 'build', 'submit'].includes(st.stage.key) && st.state === 'during';
  return (
    <Link href={`/i/${x.i.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-ink">{x.space.name}</span>
        <span className={`chip shrink-0 !text-[10px] uppercase tracking-wider ${accepting ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>{accepting ? 'Live' : st.stage?.label ?? 'Closed'}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug">{x.i.name}</h3>
      <p className="mt-1 line-clamp-3 text-[13px] text-ink/80">{x.i.tagline}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-sand/70 p-3 text-[10px]">
        <div><div className="font-bold uppercase tracking-wider">Prize pool</div><div className="text-sm font-semibold">{pula(prizePool(x.i.definition))}</div></div>
        <div><div className="font-bold uppercase tracking-wider">Entries</div><div className="text-sm">{x.entries} so far</div></div>
      </div>
      <div className="mb-5 mt-3 flex items-center gap-1.5 text-xs text-muted" title="Fingerprint of the published rules"><ShieldCheck size={13} className="text-emerald-600" /><span className="mono">Rules {x.i.rulesHash.slice(0, 14)}… · v{x.i.version}</span></div>
      <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-[13px]"><span>Closes: {fmtDate(x.i.closesAt)}</span><span className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white">Explore <ArrowRight size={13} /></span></div>
    </Link>
  );
}
