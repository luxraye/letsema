import Link from 'next/link';
import Image from 'next/image';
import { Inbox, Scale, MessagesSquare, Activity, Layers, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui';

export const metadata = { title: 'How it works' };

const JOBS = [
  {
    id: 'apply', icon: Inbox, title: '1. Take in submissions', photo: '/photos/young-makers.webp',
    lead: 'Every application lands in one place, in one shape, with nothing lost in email.',
    steps: [
      'Check you are eligible in 30 seconds, then create a free account.',
      'Fill in the form in four short steps. It saves as you type, even if your connection drops.',
      'Upload documents. We check each file is what it says it is, and warn you if it looks like it holds a password or ID number by mistake.',
      'Submit. Your answers and files are sealed with a fingerprint, you get a reference like CEDA-26-0101, and a receipt by email.',
    ],
  },
  {
    id: 'judge', icon: Scale, title: '2. Evaluate', photo: '/photos/evaluator.webp',
    lead: 'Three levels, each with its own people, so no one person decides alone.',
    steps: [
      'Screening: CEDA checks the application is complete. If something is missing, it goes back to you with a clear request, not a rejection.',
      'Scoring: independent evaluators score against the published rubric, without seeing your name. Each first declares any conflict of interest, and a conflicted evaluator is replaced automatically.',
      'Fairness: some evaluators mark hard and some soft. The portal evens this out before ranking, and flags any application where evaluators disagree by more than 20 points.',
      'Panel: the adjudication panel sees the ranked list and votes. A majority decides, and the award is the middle of the amounts proposed.',
    ],
  },
  {
    id: 'talk', icon: MessagesSquare, title: '3. Talk to innovators securely', photo: '/photos/founders-meeting.webp',
    lead: 'Every conversation is tied to the application it is about, and only the right people can read it.',
    steps: [
      'Each application has its own message thread between you and CEDA. Evaluators cannot see your name; staff can add internal notes you do not see.',
      'Requests for changes arrive in the same thread, and when you resubmit, CEDA sees exactly which words you changed.',
      'Live chat with a consultant runs Monday to Friday, 09:00 to 16:00. Outside those hours, leave a message and get a reply by email or SMS.',
      'Free alerts by email or SMS at every step, for you or anyone you share your reference with.',
    ],
  },
  {
    id: 'track', icon: Activity, title: '4. Track all of it', photo: '/photos/gaborone-aerial.webp',
    lead: 'Who did what, when and why, recorded in a way that cannot be quietly changed.',
    steps: [
      'Each application shows where it is now on a simple timeline, on your dashboard and on the public tracker.',
      'Every action (submit, screen, score, message, decide) is written to an audit trail. Each record carries a fingerprint of the one before, so editing any record breaks the chain, and anyone can check it.',
      'If the rules of a competition change after it opens, the change is published with a reason, and your application keeps the rules you applied under.',
      'Awards come with a certificate and a code anyone can verify.',
    ],
  },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader eyebrow="How it works" title="From idea to funded business, in four jobs" sub="CEDA asked for a platform that takes in submissions, lets evaluators evaluate, keeps communication with innovators secure, and tracks all of it. CEDA left the flow to us. Here is the flow we designed." />
      <nav className="mb-10 grid gap-2 sm:grid-cols-4">{JOBS.map((j) => <a key={j.id} href={`#${j.id}`} className="card flex items-center gap-2 p-3 text-sm font-semibold hover:border-[var(--brand)]"><j.icon size={18} className="text-[var(--brand)]" />{j.title.slice(3)}</a>)}</nav>

      <div className="space-y-14">
        {JOBS.map((j, n) => (
          <section key={j.id} id={j.id} className={`grid scroll-mt-24 items-center gap-8 lg:grid-cols-2 ${n % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Image src={j.photo} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /></div>
            <div>
              <div className="flex items-center gap-2 text-[var(--brand)]"><j.icon size={22} /><span className="eyebrow">{j.title}</span></div>
              <h2 className="mt-2 text-2xl font-bold">{j.lead}</h2>
              <ol className="mt-4 space-y-3">{j.steps.map((s, k) => <li key={k} className="flex gap-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xs font-bold text-[var(--brand)]">{k + 1}</span><span>{s}</span></li>)}</ol>
            </div>
          </section>
        ))}
      </div>

      <section id="instances" className="mt-16 scroll-mt-24 rounded-3xl bg-ink p-8 text-white">
        <div className="flex items-center gap-2 text-amber"><Layers size={22} /><span className="eyebrow !text-amber">Our flow</span></div>
        <h2 className="mt-2 text-3xl font-bold">Instances: one engine for every kind of competition</h2>
        <p className="mt-3 max-w-3xl text-white/80">CEDA runs open calls, hackathons, youth challenges, staff ideas and accelerators. Instead of a new system for each, an Instance is a competition defined by its rules: who can enter, the stages and dates, the questions on the form, the scoring rubric and its weights, how many evaluators each application gets, and the prizes. Admins set these up in Instance Studio with no code. Partners such as BDIH and BTC run their own Instances in their own spaces, on the same trusted rules.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
          {[['Design', 'Pick a template, adjust the form, rubric and stages, preview, publish.'], ['Run', 'Entries flow through screening, scoring and the panel; everyone sees where they are.'], ['Prove', 'The rules are fingerprinted, changes are public with reasons, and the result is reproducible.']].map(([h, t]) => <div key={h} className="rounded-2xl bg-white/5 p-4"><div className="font-bold">{h}</div><p className="text-white/70">{t}</p></div>)}
        </div>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/instances" className="btn-primary">See open competitions <ArrowRight size={16} /></Link><Link href="/judges" className="btn-ghost !border-white/30 !text-white">For the judging panel</Link></div>
      </section>
    </div>
  );
}
