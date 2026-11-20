import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { and, desc, eq, ne } from 'drizzle-orm';
import { ArrowRight, CheckCircle2, FilePen, ShieldCheck, Trophy, Compass, ChevronDown, Clock, Phone, Inbox, Scale, MessagesSquare, Activity } from 'lucide-react';
import { db, schema } from '@/db';
import { publicStats, liveInstances, showcase } from '@/lib/queries';
import { currentStage, prizePool, pula } from '@/lib/instances';
import { STATUS } from '@/lib/format';
import { Info } from '@/components/ui';
import { t } from '@/lib/i18n';
import { SystemMap } from '@/components/home/system-map';
import { StudioPreview } from '@/components/home/studio-preview';
import { AudienceTabs } from '@/components/home/audience-tabs';
import { PhonePreview } from '@/components/home/phone-preview';
import { Ambient } from '@/components/ambient';
import { CountUp } from '@/components/count-up';

export const dynamic = 'force-dynamic';

const STEPS = [
  { n: '01', h: 'Check', p: 'See if you qualify in 30 seconds, before you write a word.', icon: CheckCircle2, tile: 'border-emerald-200 bg-emerald-50 text-emerald-600', href: '/eligibility', cta: 'Check My Eligibility',
    more: ['Open to Botswana citizens; youth calls are for ages 18 to 35.', 'Companies need at least 51% citizen ownership.', 'You get an answer straight away, without creating an account.'], info: 'The checker uses the same rules as the competition, so a yes here means you can enter.' },
  { n: '02', h: 'Apply', p: 'Submit your idea, team and documents. Your work saves as you type.', icon: FilePen, tile: 'border-amber-200 bg-amber-50 text-amber-600', href: '/instances', cta: 'Browse Open Calls',
    more: ['Four short steps, in plain words, on any phone.', 'Files are checked on upload, and you are warned if one looks like it holds an ID number by mistake.', 'On submit you get a sealed receipt and a reference like CEDA-26-0101.'], info: 'If evaluators ask for changes, you resubmit in the same place and they see exactly what you changed.' },
  { n: '03', h: 'Track', p: 'Follow your application live at every step with your reference.', icon: Compass, tile: 'border-orange-200 bg-orange-50 text-[var(--brand)]', href: '/track', cta: 'Track My Progress',
    more: ['A timeline shows where your application is now.', 'Free email or SMS alerts each time it moves.', 'No data? Dial *161# from any phone.'], info: 'Anyone with your reference can follow it, but never sees your private details.' },
];

const JOBS = [
  ['1', 'Take in submissions', 'Every application, file and version lands in one secure place, sealed with a fingerprint on submit.', '/instances', Inbox],
  ['2', 'Evaluate fairly', 'Screening, then blind scoring by independent evaluators, then a panel vote. Three levels, all in the portal.', '/how-it-works#judge', Scale],
  ['3', 'Talk securely', 'A private message thread on every application. Only the applicant and CEDA staff see it.', '/how-it-works#talk', MessagesSquare],
  ['4', 'Track everything', 'A live timeline for each application and a tamper-evident record of every action.', '/track', Activity],
] as const;

const SECTOR_TILES = [
  ['Digital & Technology', 'Software, fintech, hardware prototypes and telecoms', '/photos/soldering.webp'],
  ['Manufacturing & Textiles', 'Clothing, light manufacturing and adding value locally', '/photos/tailor.webp'],
  ['Creative Arts & Crafts', 'Basketry, jewellery, digital media and heritage', '/photos/basket-weaver.webp'],
  ['Eco-Tourism & Conservation', 'Lodges, guided trips and protecting wildlife', '/photos/mokoro.webp'],
] as const;

const shortDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Africa/Gaborone' });
const STEP_OF: Record<string, number> = { submitted: 1, screening: 1, returned: 2, in_review: 2, shortlisted: 3, declined: 4, awarded: 5 };

async function demoInnovator() {
  const [u] = await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(eq(schema.users.email, 'innovator@demo.ceda.bw'));
  if (!u) return { name: 'Naledi', ideas: [] };
  const rows = await db.select({ e: schema.entries, instance: schema.instances.name }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId))
    .where(and(eq(schema.entries.innovatorId, u.id), ne(schema.entries.status, 'draft'))).orderBy(desc(schema.entries.updatedAt));
  return { name: u.name.split(' ')[0], ideas: rows.map(({ e, instance }) => ({ title: e.title, instance, status: e.status, label: STATUS[e.status]?.label ?? e.status, step: STEP_OF[e.status] ?? 1 })) };
}

export default async function Home() {
  const [stats, instances, tr, awards, demo, h] = await Promise.all([publicStats(), liveInstances(), t(), showcase(), demoInnovator(), headers()]);
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'}`;
  const qr = await QRCode.toDataURL(origin, { margin: 1, width: 220, color: { dark: '#14040b' } });
  const featured = instances.find((x) => x.i.featured) ?? instances[0];
  const stage = featured ? currentStage(featured.i.definition) : null;
  const stages = featured?.i.definition.stages ?? [];
  const from = Math.max(0, Math.min((stage?.index ?? 0) - 1, stages.length - 4));
  const phases = stages.map((s, n) => ({ s, n })).slice(from, from + 4);
  return (
    <>
      {/* Hero: the promise on the left, a live application moving on the right */}
      <section className="relative -mt-[4.5rem] overflow-hidden bg-ink pb-20 pt-32 text-white sm:pt-36">
        <Ambient />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
          <div className="min-w-0">
            <span className="rise glass-dark inline-flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3.5 text-xs font-semibold text-white/85">
              <span className="ping-soft grid size-5 place-items-center rounded-full bg-amber text-[10px] font-black text-[#2a0a14]">●</span>
              {featured ? <>{featured.i.name}{stage?.stage ? ` · now: ${stage.stage.label}` : ''}</> : 'Citizen Entrepreneurial Development Agency'}
            </span>
            <h1 className="rise-2 mt-6 text-[2.75rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.6rem]">Your idea deserves<br /><span className="text-gradient-dark">a fair shot.</span></h1>
            <p className="rise-3 mt-6 max-w-xl text-lg text-white/75">Enter CEDA competitions online, see exactly how you’ll be judged, and follow your application live at every step, on any phone.</p>
            <div className="rise-3 mt-8 flex flex-wrap items-center gap-3">
              <Link href="/instances" className="btn-primary !rounded-xl !px-6 !py-3.5 text-[15px] font-bold">{tr('See Open Competitions')} <ArrowRight size={18} /></Link>
              <Link href="/eligibility" className="btn-dark !rounded-xl !px-5 !py-3.5 text-[15px] font-bold">{tr('Am I Eligible?')} <span className="text-white/60">30s</span></Link>
            </div>
            <Link href="/judges" className="rise-3 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber hover:text-white"><Compass size={15} /> Judging the hackathon? Take the 5-minute tour <ArrowRight size={14} /></Link>
          </div>

          {/* Floating glass cards: real data from the demo innovator and the featured competition */}
          <div aria-label="A live look at an application" className="relative mx-auto h-[27rem] w-full max-w-md sm:h-[28rem]">
            {demo.ideas[0] && (
              <div className="float glass-dark absolute right-0 top-0 w-[88%] rotate-[2.5deg] rounded-3xl p-5">
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60"><span>{demo.name}’s application</span><span className="rounded-full bg-white/10 px-2 py-0.5 normal-case tracking-normal text-white/80">{demo.ideas[0].label}</span></div>
                <div className="font-display mt-2 truncate text-lg font-bold">{demo.ideas[0].title}</div>
                <ol className="mt-3 grid gap-2 text-sm">
                  {['Submitted and sealed', 'Screening', 'Blind scoring', 'Panel vote', 'Decision'].map((l, n) => {
                    const st = demo.ideas[0].step; const done = n < st; const now = n === st;
                    return <li key={l} className={`flex items-center gap-2.5 ${done || now ? 'text-white' : 'text-white/45'}`}><span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 text-[10px] ${done ? 'border-emerald-400 bg-emerald-400 text-[#06281a]' : now ? 'ping-soft border-amber' : 'border-white/25'}`}>{done ? '✓' : ''}</span>{now ? <b>{l}, in progress</b> : l}</li>;
                  })}
                </ol>
              </div>
            )}
            {featured && (
              <div className="float-slow glass-dark absolute left-0 top-[15.5rem] w-[56%] -rotate-[3deg] rounded-3xl p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Prize pool</div>
                <div className="font-display mt-1 text-3xl font-extrabold text-amber">{pula(prizePool(featured.i.definition))}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="grow-x h-full rounded-full bg-gradient-to-r from-[var(--t-brand-2)] to-amber" style={{ width: `${Math.round((((stage?.index ?? 0) + 1) / Math.max(1, stages.length)) * 100)}%` }} /></div>
                <div className="mt-1.5 text-xs text-white/65">Stage {(stage?.index ?? 0) + 1} of {stages.length} · {featured.entries} entries so far</div>
              </div>
            )}
            <div className="float-fast glass-dark absolute bottom-0 right-0 w-[48%] rounded-3xl p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60"><ShieldCheck size={13} className="text-emerald-400" /> Private message</div>
              <p className="mt-1.5 text-sm leading-snug text-white/90">Only you and CEDA staff can read this thread, and every message is kept on record.</p>
            </div>
          </div>
        </div>

        <dl className="relative mx-auto mt-16 grid max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {([
            ['Open competitions', stats.live, 'Calls, hackathons and accelerators accepting entries', ''],
            ['Applications submitted', stats.submitted, 'Counted live from the database', ''],
            ['Districts reached', stats.districts, 'Where applicants are based', ''],
            ['Awarded so far', stats.awardedSum, `${stats.awarded} funded ideas`, 'P'],
          ] as const).map(([l, v, h, pre]) => (
            <div key={l} data-spot className="glass-dark relative overflow-hidden rounded-2xl p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/65">{l}</dt>
              <dd className="font-display mt-1 text-2xl font-bold sm:text-3xl"><CountUp value={Number(v) || 0} prefix={pre} /></dd>
              <div className="absolute bottom-3 right-3"><Info dark>{h}</Info></div>
            </div>
          ))}
        </dl>
      </section>

      {/* Everything CEDA asked for, in one bento grid around the featured competition */}
      <section id="four-jobs" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal max-w-3xl"><span className="eyebrow">What CEDA asked for</span><h2 className="mt-4 text-3xl font-bold sm:text-[2.6rem]">Four jobs, done in one place</h2><p className="mt-2 text-muted">Take in submissions, evaluate them, talk to innovators securely, and track all of it. Tap any tile to see where it happens.</p></div>
          <div className="mt-10 grid gap-4 lg:grid-cols-6">
            {featured && (
              <div className="reveal card overflow-hidden p-6 sm:p-8 lg:col-span-4 lg:row-span-2">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--brand)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Featured challenge</span><span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800"><ShieldCheck size={13} /> Rules sealed ✓</span></div>
                <h3 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{featured.i.name}</h3>
                <p className="mt-3 max-w-2xl text-[15px] text-muted">{featured.i.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold"><span className="inline-flex items-center gap-1 text-amber"><Trophy size={15} /> {pula(prizePool(featured.i.definition))} prize pool</span><span className="text-muted">•</span><span>{featured.i.definition.stages.length} stages</span><span className="text-muted">•</span><span>{featured.entries} entries so far</span></div>
                <div className="mt-6 flex items-center gap-2 text-sm font-bold"><Clock size={15} className="text-copper" /> Timeline{stage?.stage && <span className="font-normal text-muted">· open now: {stage.stage.label}</span>}</div>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {phases.map(({ s, n }) => (
                    <li key={s.key} className={`rounded-xl border p-3 transition ${n === stage?.index ? 'border-[var(--brand)] bg-[var(--brand)]/10 shadow-[0_0_30px_-10px_var(--t-glow)]' : 'border-line bg-sand/50'}`}>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted">Phase {n + 1}{n === stage?.index && <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[9px] text-white">We are here</span>}</div>
                      <div className="mt-1 text-sm font-bold">{s.label}</div>
                      <div className="text-xs text-muted">{shortDate(s.starts)}{s.ends !== s.starts ? ` – ${shortDate(s.ends)}` : ''}</div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-3"><Link href={`/i/${featured.i.slug}`} className="btn-primary !px-5 !py-3 font-bold">View challenge and apply <ArrowRight size={16} /></Link><Link href="/instances" className="btn-ghost !px-5 !py-3 font-bold">All competitions</Link></div>
              </div>
            )}
            {JOBS.map(([n, h, p, href, Icon], k) => (
              <Link key={n} href={href} className={`reveal card group flex flex-col p-5 ${featured && k < 2 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--t-brand-2)] to-[var(--t-bark)] text-white shadow-[0_8px_24px_-8px_var(--t-glow)] transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"><Icon size={20} /></span><span className="font-display text-3xl font-extrabold text-line">{n}</span></div>
                <h3 className="mt-4 text-lg font-bold">{h}</h3><p className="mt-1 flex-1 text-sm text-muted">{p}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-copper">See where <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive system map */}
      <section className="relative overflow-hidden bg-ink py-20 text-white">
        <Ambient silk={false} />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mb-8 text-center">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber">Interactive system map</span>
            <h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">Explore the Entire Platform</h2>
            <p className="mx-auto mt-2 max-w-2xl text-white/70">Touch or click any branch to see its sections and jump straight there.</p>
          </div>
          <SystemMap />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><span className="eyebrow">Simple 3-step process</span><h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">How It Works</h2><p className="mx-auto mt-2 max-w-2xl text-muted">From your first idea to a funded company: clear steps, plain words, and no hidden surprises.</p></div>
          <div className="mt-10 grid items-start gap-5 md:grid-cols-3">
            {STEPS.map((x) => (
              <div key={x.n} className="reveal card flex flex-col p-7">
                <div className="flex items-center justify-between"><span className="font-display text-4xl font-extrabold text-gradient">{x.n}</span><span className={`grid size-11 place-items-center rounded-xl border ${x.tile}`}><x.icon size={20} /></span></div>
                <h3 className="mt-5 text-xl font-bold">{x.h}</h3><p className="mt-1 text-[15px]">{x.p}</p>
                <details className="group mt-5 border-t border-line pt-4" open={x.n === '01'}>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">What happens here?<ChevronDown size={16} className="transition group-open:rotate-180" /></summary>
                  <ul className="mt-3 space-y-2 pl-3 text-sm">{x.more.map((m) => <li key={m}>{m}</li>)}</ul>
                </details>
                <div className="relative mt-5 flex items-center justify-between border-t border-line pt-4"><Link href={x.href} className="inline-flex items-center gap-1 text-sm font-bold hover:text-[var(--brand)]">{x.cta} <ArrowRight size={15} /></Link><Info>{x.info}</Info></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instance Studio */}
      <section className="border-y border-line bg-alt py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center"><span className="eyebrow">Instance Studio interactive visual</span><h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">See How a Competition is Built</h2><p className="mx-auto mt-2 max-w-2xl">Every challenge on the platform runs on an “Instance”: a competition blueprint with sealed rules anyone can check.</p></div>
          <StudioPreview />
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center"><span className="eyebrow">Fairness for everyone</span><h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">Who It&apos;s For</h2><p className="mx-auto mt-2 max-w-2xl">Judged on the idea, not on who you know. Built to give every founder, evaluator and partner peace of mind.</p></div>
          <AudienceTabs />
        </div>
      </section>

      {/* Mobile first */}
      <section className="border-t border-line py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--brand)]">Mobile first</span>
          <h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">Apply From Any Phone</h2>
          <p className="mx-auto mb-10 mt-2 max-w-2xl text-muted">Flip the phone to get a QR code for your own smartphone, or <Link href="/dial" className="font-semibold underline">dial *161#</Link> with no data at all.</p>
          <PhonePreview name={demo.name} ideas={demo.ideas} qr={qr} url={origin} />
        </div>
      </section>

      {/* Sectors and recent awards */}
      <section className="border-t border-line bg-alt py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl"><span className="eyebrow">Priority sectors</span><h2 className="mt-4 text-3xl font-bold sm:text-[2.5rem]">Funded Sectors & Opportunities</h2><p className="mt-2">CEDA backs citizen ventures that diversify the economy, create jobs for young people, and grow exports.</p></div>
            <Link href="/instances" className="inline-flex items-center gap-1 text-sm font-bold hover:text-[var(--brand)]">View challenges by sector <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTOR_TILES.map(([h, p, img]) => (
              <Link key={h} href="/instances" className="reveal group relative block aspect-[8/7] overflow-hidden rounded-2xl ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_var(--t-glow)]">
                <Image src={img} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white"><div className="text-lg font-bold">{h}</div><p className="text-xs text-white/80">{p}</p></div>
              </Link>
            ))}
          </div>
          {awards.length > 0 && (
            <div className="mt-12 rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
                <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-amber/15 text-amber-700"><Trophy size={20} /></span><div><h3 className="text-xl font-bold">Recently Awarded Citizen Startups</h3><p className="text-sm text-muted">Each award has a certificate with a code anyone can verify.</p></div></div>
                <Link href="/funded" className="inline-flex items-center gap-1 text-sm font-bold hover:text-[var(--brand)]">Explore all funded startups <ArrowRight size={15} /></Link>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {awards.slice(0, 3).map(({ e, instance }) => (
                  <div key={e.id} className="flex min-w-0 flex-col rounded-2xl border border-line p-5">
                    <div className="flex items-center justify-between gap-2"><span className="truncate rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{e.sector ?? 'General'}</span><span className="shrink-0 whitespace-nowrap text-sm font-bold text-emerald-700">{pula(e.awardAmount)} award</span></div>
                    <h4 className="mt-3 font-bold">{e.title}</h4><div className="text-sm text-muted">{instance}</div>
                    <p className="mt-2 flex-1 text-sm">{e.summary}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs"><Link href={`/certificate/${e.ref}`} className="font-bold hover:text-[var(--brand)]">View certificate</Link><span className="mono text-muted">{e.ref}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-alt pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal relative overflow-hidden rounded-3xl text-white shadow-2xl">
            <Image src="/photos/okavango-aerial.webp" alt="" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/20" />
            <div className="relative max-w-2xl p-8 sm:p-16">
              <span className="rounded-full border border-amber/50 bg-amber/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber">Start today</span>
              <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-[2.6rem]">Turn your innovation into a funded commercial enterprise.</h2>
              <p className="mt-4 text-lg text-white/80">Check your eligibility in 30 seconds, submit your pitch, and follow your application at every step.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/instances" className="btn-primary !rounded-lg !px-6 !py-3 font-bold">Browse Open Challenges <ArrowRight size={16} /></Link><Link href="/eligibility" className="btn-dark !rounded-lg !px-6 !py-3 font-bold">Check My Eligibility</Link></div>
              <div className="mt-8 flex items-start gap-3 border-t border-white/15 pt-5 text-sm text-white/80"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber/20 text-amber"><Phone size={15} /></span><p><b className="text-white">No internet data?</b> Dial <Link href="/dial" className="mono rounded bg-amber/20 px-1.5 py-0.5 font-bold text-amber">*161#</Link> from any phone to check your application and open competitions, free of charge.</p></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
