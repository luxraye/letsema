'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Scale, ShieldCheck, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Info } from '@/components/ui';

const TABS = [
  { key: 'Innovators', icon: Users, eyebrow: 'For innovators', title: 'Enter with confidence: judged on merit, not on who you know',
    points: ['Every application gets a sealed receipt with a fingerprint of exactly what you sent and when.', 'Evaluators score without seeing your name or your company.', 'Follow every step on the web, by free SMS alerts, or by dialling *161# without data.'],
    box: ['Sealed receipt and blind scoring', 'Your identity is hidden from evaluators, and your receipt proves what you submitted.'],
    cta: ['Check My Eligibility & Apply', '/eligibility'], photo: '/photos/team-coding.webp', caption: 'A software team at work' },
  { key: 'Evaluators', icon: Scale, eyebrow: 'For evaluators', title: 'Score fairly, and see how your marking compares',
    points: ['Declare any conflict before you see an application; a conflicted evaluator is replaced automatically.', 'Score each criterion against a written guide, with a note for the innovator.', 'See if you mark harder or softer than others. Calibration evens it out before ranking.'],
    box: ['Calibrated ranking', 'Applications where evaluators disagree by more than 20 points are flagged for the panel.'],
    cta: ['Try it as an evaluator', '/judges'], photo: '/photos/evaluator.webp', caption: 'An evaluator reviewing an application' },
  { key: 'CEDA Team', icon: ShieldCheck, eyebrow: 'For the CEDA team', title: 'Run every competition from one place, with a record of every step',
    points: ['Build a competition in Instance Studio with no code: form, stages, rubric and prizes.', 'Screen, assign evaluators, chat with innovators and answer tickets against deadlines.', 'Live reports on participation, outcomes, timelines and evaluator fairness.'],
    box: ['Audit trail anyone can verify', 'Every action is chained to the one before it, so a quiet edit breaks the chain.'],
    cta: ['See the admin view', '/judges'], photo: '/photos/founders-meeting.webp', caption: 'A CEDA team meeting with founders' },
  { key: 'Partners', icon: Building2, eyebrow: 'For partners', title: 'Run your own challenge on CEDA’s trusted engine',
    points: ['BDIH, BTC and others get their own space, branding and evaluators.', 'The same sealed rules, blind scoring and audit trail as CEDA’s own calls.', 'Pull results into your systems through a partner API scoped to your space.'],
    box: ['Your space, same rules', 'Partners see only their own competitions and applications.'],
    cta: ['Visit a partner space', '/spaces/bdih'], photo: '/photos/lab-drone.webp', caption: 'A partner innovation lab' },
];

export function AudienceTabs() {
  const [i, setI] = useState(0);
  const t = TABS[i];
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="tablist">
        {TABS.map((x, n) => (
          <button key={x.key} type="button" role="tab" aria-selected={i === n} onClick={() => setI(n)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${i === n ? 'bg-[var(--brand)] text-white shadow' : 'bg-sand text-ink hover:bg-stone-200'}`}><x.icon size={15} />{x.key}</button>
        ))}
      </div>
      <div className="mt-8 grid items-center gap-8 rounded-3xl border border-line bg-sand/30 p-6 sm:p-10 lg:grid-cols-2" role="tabpanel">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider">{t.eyebrow}</div>
          <h3 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{t.title}</h3>
          <ul className="mt-5 space-y-3">{t.points.map((p) => <li key={p} className="flex gap-3 text-sm"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />{p}</li>)}</ul>
          <div className="relative mt-5 flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4"><div><div className="text-sm font-bold">{t.box[0]}</div><p className="text-xs text-muted">{t.box[1]}</p></div><Info>{t.box[1]}</Info></div>
          <Link href={t.cta[1]} className="btn-primary mt-6 !rounded-lg !px-5 !py-2.5 text-sm font-bold">{t.cta[0]} <ArrowRight size={15} /></Link>
        </div>
        <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
          <Image key={t.photo} src={t.photo} alt="" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
          <figcaption className="absolute inset-x-3 bottom-3 rounded-lg bg-ink/70 px-3 py-2 text-xs text-white backdrop-blur">{t.caption}</figcaption>
        </figure>
      </div>
    </div>
  );
}
