import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { schema } from '@/db';
import { currentStage, prizePool, pula } from '@/lib/instances';
import { fmtDate } from '@/lib/format';

type Row = { i: typeof schema.instances.$inferSelect; space: typeof schema.spaces.$inferSelect; entries: number };

export function InstanceCard({ x }: { x: Row }) {
  const st = currentStage(x.i.definition);
  const accepting = x.i.status === 'live' && st.stage && ['apply', 'register', 'build', 'submit'].includes(st.stage.key) && st.state === 'during';
  return (
    <Link href={`/i/${x.i.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-36">
        <Image src={x.i.photo ?? '/photos/team-coding.webp'} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 chip text-white" style={{ background: x.space.primary }}>{x.space.short}</span>
        <span className={`absolute right-3 top-3 chip ${accepting ? 'bg-emerald-500 text-white' : 'bg-white/90 text-ink'}`}>{accepting ? 'Accepting entries' : st.stage?.label ?? 'Closed'}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug">{x.i.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{x.i.tagline}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-sand/70 p-3 text-xs">
          <div><div className="font-bold uppercase tracking-wider text-muted">Prizes</div><div className="text-sm font-bold">{pula(prizePool(x.i.definition))}</div></div>
          <div><div className="font-bold uppercase tracking-wider text-muted">Entries</div><div className="text-sm font-bold">{x.entries}</div></div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted" title="Fingerprint of the published rules"><ShieldCheck size={13} className="text-emerald-600" /><span className="mono">Rules {x.i.rulesHash.slice(0, 10)}… · v{x.i.version}</span></div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-sm"><span className="text-muted">Closes {fmtDate(x.i.closesAt)}</span><span className="inline-flex items-center gap-1 font-bold text-[var(--brand)]">Explore <ArrowRight size={15} /></span></div>
      </div>
    </Link>
  );
}
