'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Inbox, Scale, MessagesSquare, Activity, RotateCw } from 'lucide-react';

const JOBS = [
  { n: '1', h: 'Take in submissions', short: 'One secure place for every idea.', icon: Inbox, href: '/instances',
    more: ['A four-step form that saves as you type, on any phone', 'Files are checked on upload', 'Sealed on submit, with a receipt and a reference like CEDA-26-0101'] },
  { n: '2', h: 'Evaluate fairly', short: 'Three levels, all in the portal.', icon: Scale, href: '/how-it-works#judge',
    more: ['Screening checks each application is complete', 'Independent evaluators score blind and declare conflicts first', 'A panel compares the scores and votes on the winners'] },
  { n: '3', h: 'Talk securely', short: 'A private thread on every application.', icon: MessagesSquare, href: '/how-it-works#talk',
    more: ['Only the applicant and CEDA staff can read it', 'Requested changes show word by word what was edited', 'Email and SMS alerts, plus live chat in office hours'] },
  { n: '4', h: 'Track everything', short: 'Every step and action on record.', icon: Activity, href: '/track',
    more: ['A live timeline for each application', 'Free SMS alerts, or dial *161# with no data', 'A tamper-evident record of every action that anyone can verify'] },
] as const;

/** CEDA's four jobs as small cards that flip over to explain themselves. */
export function JobCards() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {JOBS.map((j) => {
        const flipped = open === j.n;
        return (
          <div key={j.n} className="flip reveal h-[15.5rem]" data-flipped={flipped || undefined}>
            <div className="flip-inner">
              <button type="button" aria-expanded={flipped} aria-controls={`job-${j.n}`} onClick={() => setOpen(flipped ? null : j.n)}
                className="flip-face card group flex flex-col p-5 text-left" tabIndex={flipped ? -1 : 0} aria-hidden={flipped || undefined}>
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--t-brand-2)] to-[var(--t-bark)] text-white shadow-[0_8px_24px_-8px_var(--t-glow)] transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"><j.icon size={20} /></span>
                  <span className="font-display text-3xl font-extrabold text-line">{j.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{j.h}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{j.short}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-copper"><RotateCw size={14} className="transition duration-500 group-hover:rotate-180" /> Tap to see how</span>
              </button>
              <div id={`job-${j.n}`} className="flip-face flip-back card group/back flex cursor-pointer flex-col p-5" aria-hidden={!flipped || undefined}>
                {/* The whole back is a button: tap anywhere to flip the card back. */}
                <button type="button" onClick={() => setOpen(null)} tabIndex={flipped ? 0 : -1} aria-label={`Flip ${j.h} back`} className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-2 focus-visible:outline-[var(--brand)]" />
                <div className="pointer-events-none relative flex items-start justify-between gap-2">
                  <h3 className="font-bold">{j.h}</h3>
                  <Link href={j.href} tabIndex={flipped ? 0 : -1} aria-label={`See where “${j.h}” happens`} title="See where it happens"
                    className="pointer-events-auto relative z-10 -mr-1 -mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand)]/12 px-2.5 py-1 text-xs font-bold text-copper transition hover:bg-[var(--brand)] hover:text-white">
                    See it <ArrowUpRight size={13} />
                  </Link>
                </div>
                <ul className="pointer-events-none relative mt-3 flex-1 space-y-2 text-[13.5px] leading-snug">
                  {j.more.map((m) => <li key={m} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--brand)]" />{m}</li>)}
                </ul>
                <span className="pointer-events-none relative mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted"><RotateCw size={13} className="transition duration-500 group-hover/back:-rotate-180" /> Tap again to flip back</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
