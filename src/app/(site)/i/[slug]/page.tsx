import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { ShieldCheck, Users, CalendarDays, Trophy, History } from 'lucide-react';
import { db, schema } from '@/db';
import { acceptingEntries, currentStage, prizePool, pula, rulesHash } from '@/lib/instances';
import { fmtDate } from '@/lib/format';
import { StageTrack, Notice, Badge } from '@/components/ui';
import { startEntry } from '@/app/actions/entries';
import { EligibilityChecker } from '@/components/eligibility-checker';
import { Submit } from '@/components/forms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [i] = await db.select({ name: schema.instances.name }).from(schema.instances).where(eq(schema.instances.slug, slug));
  return { title: i?.name ?? 'Competition' };
}

export default async function InstancePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ closed?: string; staffOnly?: string }> }) {
  const { slug } = await params; const sp = await searchParams;
  const [row] = await db.select({ i: schema.instances, space: schema.spaces }).from(schema.instances).innerJoin(schema.spaces, eq(schema.spaces.id, schema.instances.spaceId)).where(eq(schema.instances.slug, slug)).limit(1);
  if (!row || row.i.status === 'draft') notFound();
  const { i, space } = row; const d = i.definition;
  const versions = await db.select().from(schema.instanceVersions).where(eq(schema.instanceVersions.instanceId, i.id)).orderBy(desc(schema.instanceVersions.version));
  const st = currentStage(d);
  const open = acceptingEntries(d, i.status);
  const intact = rulesHash(d) === i.rulesHash;
  const apply = startEntry.bind(null, i.slug);
  return (
    <div style={{ ['--brand' as string]: space.primary }}>
      <section className="relative overflow-hidden bg-ink text-white">
        <Image src={i.photo ?? '/photos/team-coding.webp'} alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-14">
          <Link href={`/spaces/${space.slug}`} className="chip text-white" style={{ background: space.primary }}>{space.name}</Link>
          <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">{i.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">{i.description}</p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/85">
            <span className="flex items-center gap-2"><Trophy size={16} className="text-amber" />{pula(prizePool(d))} in prizes</span>
            <span className="flex items-center gap-2"><Users size={16} className="text-amber" />Teams of {d.team.min === d.team.max ? d.team.min : `${d.team.min}–${d.team.max}`}</span>
            <span className="flex items-center gap-2"><CalendarDays size={16} className="text-amber" />{fmtDate(i.opensAt)} → {fmtDate(i.closesAt)}</span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            {open ? <form action={apply}><Submit className="btn-primary !px-6 !py-3 text-base">Apply now</Submit></form> : <span className="btn-dark !cursor-default">{i.status === 'closed' ? 'Closed' : `Entries not open now: ${st.stage?.label ?? ''}`}</span>}
            <a href="#eligible" className="btn-dark !px-5 !py-3">Am I eligible?</a>
          </div>
          {sp.closed && <p className="mt-4 text-sm text-amber">This competition is not accepting new entries right now.</p>}
          {sp.staffOnly && <p className="mt-4 text-sm text-amber">This campaign is open to CEDA staff only.</p>}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="mb-4 text-2xl font-bold">Timeline</h2>
            <StageTrack stages={d.stages} current={st.index} />
            {d.stages.filter((s) => s.note).map((s) => <p key={s.key} className="mt-2 text-sm text-muted"><b>{s.label}:</b> {s.note}</p>)}
          </section>
          <section>
            <h2 className="mb-1 text-2xl font-bold">How you will be scored</h2>
            <p className="mb-4 text-sm text-muted">Each evaluator scores every criterion from 0 to 10. Your score is the weighted total out of 100. At least {d.reviewersPerEntry} independent evaluators score each application, without seeing your name; scores are then calibrated so a strict or generous marker cannot tip the result.</p>
            <div className="card divide-y divide-line">
              {d.rubric.map((c) => (
                <div key={c.key} className="flex items-start gap-4 p-4">
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[var(--brand)]/10 text-lg font-extrabold text-[var(--brand)]">{c.weight}%</div>
                  <div><div className="font-semibold">{c.label}</div><div className="text-sm text-muted">{c.guide}</div></div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-2xl font-bold">What you will be asked</h2>
            <ol className="card divide-y divide-line">
              {d.form.map((f, n) => <li key={f.key} className="flex gap-3 p-4 text-sm"><span className="mono text-muted">{n + 1}.</span><span><b>{f.label}</b>{f.required && <span className="text-[var(--brand)]"> *</span>}{f.help && <span className="block text-muted">{f.help}</span>}{f.maxWords && <span className="block text-xs text-muted">Up to {f.maxWords} words</span>}{f.type === 'file' && <span className="block text-xs text-muted">{(f.accept ?? []).join(', ').toUpperCase()} up to {f.maxMb} MB{f.maxPages ? `, ${f.maxPages} pages` : ''}</span>}</span></li>)}
            </ol>
          </section>
          <section id="eligible" className="scroll-mt-24">
            <h2 className="mb-4 text-2xl font-bold">Am I eligible?</h2>
            <EligibilityChecker def={d} />
          </section>
        </div>
        <aside className="space-y-5">
          {d.prizes.length > 0 && (
            <div className="card p-5"><h3 className="mb-3 font-bold">Prizes</h3><ul className="space-y-2 text-sm">{d.prizes.map((p) => <li key={p.place} className="flex justify-between gap-3"><span>{p.place}</span><b>{pula(p.amount)}</b></li>)}</ul></div>
          )}
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-emerald-600" /> Sealed rules</h3>
            <p className="mt-1 text-sm text-muted">The dates, questions, score sheet and eligibility above are fingerprinted. Any change creates a new version with a public reason.</p>
            <div className="mono mt-3 break-all rounded-lg bg-sand p-2 text-[11px]">{i.rulesHash}</div>
            <div className="mt-2">{intact ? <Badge tone="green">Fingerprint matches the rules shown</Badge> : <Badge tone="red">Fingerprint mismatch</Badge>}</div>
            <h4 className="mt-4 flex items-center gap-1.5 text-sm font-bold"><History size={15} /> Version history</h4>
            <ul className="mt-2 space-y-2 text-xs">
              {versions.map((v) => <li key={v.id} className="rounded-lg border border-line p-2"><b>v{v.version}</b> · {fmtDate(v.createdAt)}<div className="text-muted">{v.reason}</div>{v.changes.length > 0 && <ul className="mt-1 list-disc pl-4">{v.changes.map((c) => <li key={c}>{c}</li>)}</ul>}</li>)}
            </ul>
          </div>
          <div className="card p-5 text-sm"><h3 className="font-bold">Questions?</h3><p className="mt-1 text-muted">Use live chat (bottom right) on working days 09:00–16:00, or read the <Link className="underline" href="/help">help pages</Link>.</p></div>
        </aside>
      </div>
    </div>
  );
}
