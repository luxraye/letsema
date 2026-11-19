import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, FileText, Radar, ShieldCheck, Trophy, Scale, LifeBuoy, Hammer, Lock, Compass } from 'lucide-react';
import { publicStats, liveInstances } from '@/lib/queries';
import { currentStage, prizePool, pula } from '@/lib/instances';
import { StageTrack, Info } from '@/components/ui';
import { InstanceCard } from '@/components/instance-card';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const BRANCHES = [
  { label: 'Compete', text: 'Find a call, check you qualify, apply', href: '/instances', icon: Trophy, angle: -90, tone: '#f4a62a' },
  { label: 'Build', text: 'Autosaved forms, team, files checked on upload', href: '/how-it-works#apply', icon: Hammer, angle: -30, tone: '#d94914' },
  { label: 'Judge', text: 'Conflict checks, blind scoring, calibration', href: '/how-it-works#judge', icon: Scale, angle: 30, tone: '#2f9e75' },
  { label: 'Award', text: 'Panel vote, certificate anyone can verify', href: '/funded', icon: CheckCircle2, angle: 90, tone: '#c0262d' },
  { label: 'Help', text: 'Live chat, FAQs, regulators, support times', href: '/help', icon: LifeBuoy, angle: 150, tone: '#e0719b' },
  { label: 'Trust', text: 'Sealed rules, audit trail, privacy, status', href: '/status', icon: Lock, angle: 210, tone: '#3a8fd1' },
];

export default async function Home() {
  const [stats, instances, tr] = await Promise.all([publicStats(), liveInstances(), t()]);
  const featured = instances.find((x) => x.i.featured) ?? instances[0];
  const stage = featured ? currentStage(featured.i.definition) : null;
  const pipe = Object.fromEntries(stats.pipeline.map((p) => [p.status, p.n]));
  const flow = [
    ['Submitted', (pipe.submitted ?? 0) + (pipe.screening ?? 0)],
    ['With evaluators', (pipe.in_review ?? 0) + (pipe.returned ?? 0)],
    ['Shortlisted', pipe.shortlisted ?? 0],
    ['Funded', pipe.awarded ?? 0],
  ] as const;
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <Image src="/photos/hero-lab.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="rise max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-bold text-amber"><span className="size-1.5 rounded-full bg-amber" />Citizen Entrepreneurial Development Agency</span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-[3.6rem]">Your idea. CEDA’s backing.<br /><span className="bg-gradient-to-r from-amber to-[#f8c808] bg-clip-text text-transparent">A fair shot.</span></h1>
            <p className="mt-5 max-w-2xl text-lg text-white/80">Enter CEDA competitions online, see exactly how you’ll be judged, and follow your application at every step.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/instances" className="btn-primary !px-5 !py-3 text-base">{tr('See open competitions')} <ArrowRight size={18} /></Link>
              <Link href="/eligibility" className="btn-dark !px-5 !py-3 text-base">{tr('Am I eligible?')} (30 seconds)</Link>
              <Link href="/judges" className="inline-flex items-center gap-1.5 self-center px-2 text-xs font-semibold text-amber hover:text-white"><Compass size={15} /> Take the 3-minute judges’ tour <ArrowRight size={14} /></Link>
            </div>
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 lg:grid-cols-4">
            {[
              ['Open competitions', stats.live, 'Calls, hackathons and accelerators accepting entries'],
              ['Applications submitted', stats.submitted, 'Counted live from the database'],
              ['Districts reached', stats.districts, 'Where applicants are based'],
              ['Awarded so far', pula(stats.awardedSum), `${stats.awarded} funded ideas`],
            ].map(([l, v, h]) => (
              <div key={l as string} className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{l}</dt>
                <dd className="mt-1 text-2xl font-bold sm:text-3xl">{v}</dd>
                <div className="absolute bottom-3 right-3"><Info dark>{h}</Info></div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The four jobs from the CEDA brief */}
      <section id="four-jobs" className="scroll-mt-20 border-b border-line bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl"><span className="eyebrow">What CEDA asked for</span><h2 className="mt-3 text-3xl font-bold">Four jobs, done in one place</h2><p className="mt-2 text-muted">CEDA asked for a platform that takes in submissions, lets evaluators evaluate, keeps communication with innovators secure, and tracks all of it. Here is where each happens.</p></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['1', 'Take in submissions', 'Every application, file and version lands in one secure repository, sealed with a fingerprint on submit.', '/instances'],
              ['2', 'Evaluate', 'Screening, then blind scoring by independent evaluators, then a panel vote. Three levels, all in the portal.', '/how-it-works#judge'],
              ['3', 'Talk to innovators securely', 'A private message thread on every application. Only the applicant and CEDA staff see it, and every message is recorded.', '/how-it-works#talk'],
              ['4', 'Track everything', 'A live status timeline for each application and a tamper-evident audit log of every action.', '/track'],
            ].map(([n, h, p, href]) => (
              <Link key={n} href={href} className="card group p-5 transition hover:border-[var(--brand)]">
                <span className="grid size-9 place-items-center rounded-full bg-[var(--brand)] font-bold text-white">{n}</span>
                <h3 className="mt-3 font-bold">{h}</h3><p className="mt-1 text-sm text-muted">{p}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform map */}
      <section className="bg-bark py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-amber/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber">The whole platform on one screen</span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">One engine, six ways in</h2>
            <p className="mx-auto mt-2 max-w-2xl text-white/70">Every competition runs on the same engine. Pick a branch to see that part of the journey.</p>
          </div>
          <div className="relative mx-auto mt-10 hidden aspect-square max-w-[620px] md:block">
            <div className="absolute inset-[12%] rounded-full border border-dashed border-white/15" style={{ animation: 'orbit 90s linear infinite' }} />
            <div className="absolute inset-[30%] rounded-full border border-white/10" />
            <Link href="/how-it-works" className="absolute left-1/2 top-1/2 grid size-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-brand to-amber text-center shadow-[0_0_80px_rgba(217,73,20,.55)] transition hover:scale-105">
              <span><Radar className="mx-auto mb-1" /><span className="block text-sm font-bold uppercase leading-tight">CEDA idea<br />engine</span></span>
            </Link>
            {BRANCHES.map((b) => {
              const r = 40; const x = 50 + r * Math.cos((b.angle * Math.PI) / 180); const y = 50 + r * Math.sin((b.angle * Math.PI) / 180);
              return (
                <Link key={b.label} href={b.href} className="group absolute w-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-ink/80 p-3 text-center backdrop-blur transition hover:-translate-y-[54%] hover:bg-ink" style={{ left: `${x}%`, top: `${y}%`, borderColor: `${b.tone}66`, boxShadow: `0 0 30px ${b.tone}22` }}>
                  <b.icon className="mx-auto" size={22} style={{ color: b.tone }} />
                  <div className="mt-1 font-bold">{b.label}</div>
                  <div className="text-[11px] leading-snug text-white/60">{b.text}</div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:hidden">
            {BRANCHES.map((b) => <Link key={b.label} href={b.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink/60 p-4"><b.icon size={22} style={{ color: b.tone }} /><span><b>{b.label}</b><span className="block text-xs text-white/60">{b.text}</span></span></Link>)}
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Live pipeline">
            {flow.map(([l, n], i) => (
              <div key={l} className="relative rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-3xl font-bold text-amber">{n}</div><div className="text-xs text-white/70">{l}</div>
                {i < flow.length - 1 && <ArrowRight size={16} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-white/30 sm:block" />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-white/50">Live pipeline across all public competitions. Names are never shown.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><span className="eyebrow">Three simple steps</span><h2 className="mt-3 text-3xl font-bold sm:text-4xl">How it works</h2><p className="mt-2 text-muted">From your first idea to a funded company: clear steps, plain words, no surprises.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['01', 'Check', 'See if you qualify in 30 seconds, before you write a word.', '/eligibility', 'Check eligibility', CheckCircle2],
              ['02', 'Apply', 'Answer plain questions. Your work saves as you type, even offline.', '/instances', 'Browse competitions', FileText],
              ['03', 'Track', 'Follow your reference live and get free email or SMS alerts.', '/track', 'Track an application', Radar],
            ].map(([n, h, p, href, cta, Icon]) => {
              const I = Icon as typeof CheckCircle2;
              return (
                <div key={n as string} className="card flex flex-col p-6">
                  <div className="flex items-center justify-between"><span className="mono text-2xl font-bold text-muted">{n as string}</span><span className="grid size-10 place-items-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]"><I size={20} /></span></div>
                  <h3 className="mt-4 text-xl font-bold">{h as string}</h3><p className="mt-1 flex-1 text-muted">{p as string}</p>
                  <Link href={href as string} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[var(--brand)]">{cta as string} <ArrowRight size={15} /></Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="bg-sand/70 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="card overflow-hidden">
              <div className="grid lg:grid-cols-[1.4fr_1fr]">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2"><span className="chip bg-[var(--brand)] text-white">Featured</span><span className="chip bg-emerald-100 text-emerald-800"><ShieldCheck size={13} /> Rules sealed</span></div>
                  <h2 className="mt-4 text-3xl font-bold">{featured.i.name}</h2>
                  <p className="mt-2 text-muted">{featured.i.description}</p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm"><span><b>{pula(prizePool(featured.i.definition))}</b> in prizes</span><span><b>{featured.i.definition.stages.length}</b> stages</span><span><b>{featured.entries}</b> entries so far</span></div>
                  <div className="mt-6 flex flex-wrap gap-3"><Link href={`/i/${featured.i.slug}`} className="btn-primary">View and apply <ArrowRight size={16} /></Link><Link href="/instances" className="btn-ghost">All competitions</Link></div>
                </div>
                <div className="relative min-h-56"><Image src={featured.i.photo ?? '/photos/team-coding.webp'} alt="" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" /></div>
              </div>
              <div className="border-t border-line p-6 sm:p-8">
                <div className="mb-3 text-sm font-bold">Where we are now{stage?.stage ? `: ${stage.stage.label}` : ''}</div>
                <StageTrack stages={featured.i.definition.stages.slice(0, 8)} current={stage?.index ?? 0} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Open competitions */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Enter now</span><h2 className="mt-3 text-3xl font-bold">Open competitions</h2></div><Link href="/instances" className="btn-ghost">See all <ArrowRight size={16} /></Link></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{instances.slice(0, 6).map((x) => <InstanceCard key={x.i.id} x={x} />)}</div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-sand/70 py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3">
          {[
            ['Innovators', 'Apply in plain language, on any phone. See your score sheet before you start, and get written feedback either way.', '/photos/innovator-portrait.webp', '/instances'],
            ['Evaluators', 'Declare conflicts, score blind against weighted criteria, and see how your marking compares, so no idea is punished for a tough marker.', '/photos/evaluator.webp', '/how-it-works#judge'],
            ['Partners', 'BDIH, BTC and others run their own branded challenges on CEDA’s engine, with their own evaluators and the same sealed rules.', '/photos/founders-meeting.webp', '/spaces/bdih'],
          ].map(([h, p, img, href]) => (
            <Link key={h} href={href} className="card group overflow-hidden">
              <div className="relative h-48"><Image src={img} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-5"><h3 className="text-lg font-bold">{h}</h3><p className="mt-1 text-sm text-muted">{p}</p></div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 text-white">
        <Image src="/photos/okavango-aerial.webp" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/75" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Botswana’s next big business could be yours</h2>
          <p className="mt-3 text-white/80">Create a free account in a minute. No paperwork to print, no queues.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/register" className="btn-primary !px-6 !py-3 text-base">Create free account</Link><Link href="/judges" className="btn-dark !px-6 !py-3 text-base">Judges’ 5-minute tour</Link></div>
        </div>
      </section>
    </>
  );
}
