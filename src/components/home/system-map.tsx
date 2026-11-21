'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Play, Pause, Trophy, Hammer, Scale, Award, LifeBuoy, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Info } from '@/components/ui';

const NODES = [
  { key: 'compete', label: 'Compete', icon: Trophy, tone: '#f08a24', angle: 15, sections: [['Open competitions', '/instances'], ['Am I eligible?', '/eligibility'], ['Create an account', '/register'], ['Track an application', '/track']] },
  { key: 'build', label: 'Build', icon: Hammer, tone: '#e0622a', angle: 82, sections: [['Autosaving four-step form', '/how-it-works#apply'], ['Files checked on upload', '/how-it-works#apply'], ['Sealed receipt you can verify', '/verify']] },
  { key: 'judge', label: 'Judge', icon: Scale, tone: '#2fae7a', angle: 140, sections: [['Screening for completeness', '/how-it-works#judge'], ['Blind scoring, conflicts declared', '/how-it-works#judge'], ['Calibration and disagreement flags', '/how-it-works#judge'], ['Panel vote', '/judges']] },
  { key: 'award', label: 'Award', icon: Award, tone: '#f2c40f', angle: 200, sections: [['Funded innovators', '/funded'], ['Verify a certificate', '/verify'], ['Community', '/community']] },
  { key: 'trust', label: 'Trust', icon: ShieldCheck, tone: '#25a8b8', angle: 262, sections: [['Audit trail anyone can check', '/api/audit/verify'], ['Rules sealed, changes published', '/how-it-works#track'], ['Privacy and your rights', '/privacy'], ['Status and hosting', '/status']] },
  { key: 'help', label: 'Help', icon: LifeBuoy, tone: '#e5486b', angle: 318, sections: [['Help and FAQs', '/help'], ['Live chat, Mon to Fri', '/help'], ['No data? Dial *161#', '/dial'], ['Report a problem', '/help#support']] },
] as const;

/** The closed loop, in the order an idea travels. */
const JOURNEY = ['compete', 'build', 'judge', 'award', 'trust', 'help'];

export function SystemMap() {
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let n = 0;
    setActive(JOURNEY[0]);
    const t = setInterval(() => { n += 1; if (n >= JOURNEY.length) { setPlaying(false); return; } setActive(JOURNEY[n]); }, 1800);
    return () => clearInterval(t);
  }, [playing]);

  const node = NODES.find((x) => x.key === active);
  const pick = (k: string) => { setPlaying(false); setActive((a) => (a === k ? null : k)); };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <span className="flex items-center gap-2 text-sm font-semibold text-white/85"><Compass size={16} /> Singularity Core</span>
        <span className="flex items-center gap-3">
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center gap-1.5 rounded-full border border-amber/50 bg-amber/10 px-3.5 py-1.5 text-xs font-bold text-amber transition hover:bg-amber/20">
            {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? 'Pause journey' : 'Play Closed-Loop Journey'}
          </button>
          <span className="relative"><Info dark>Each branch is one part of the platform. Click one to see its sections, or play the journey to follow an idea from eligibility to award.</Info></span>
        </span>
      </div>

      {/* Wide screens: the orbit */}
      <div className="relative mx-auto mt-6 mb-2 hidden aspect-[4/3] max-w-3xl md:block">
        <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden>
          <circle cx="200" cy="150" r="118" fill="none" stroke="rgba(255,255,255,.08)" strokeDasharray="3 6" style={{ transformOrigin: '200px 150px', animation: 'orbit 120s linear infinite' }} />
          <circle cx="200" cy="150" r="70" fill="none" stroke="rgba(255,255,255,.06)" />
          {NODES.map((n) => {
            const a = (n.angle * Math.PI) / 180;
            return <line key={n.key} x1="200" y1="150" x2={200 + 118 * Math.cos(a)} y2={150 + 118 * Math.sin(a)} stroke={active === n.key ? n.tone : 'rgba(255,255,255,.12)'} strokeDasharray="2 4" strokeWidth={active === n.key ? 1.5 : 1} />;
          })}
        </svg>
        {/* Pulses that spread evenly from behind the core */}
        <span aria-hidden className="core-pulse" /><span aria-hidden className="core-pulse" style={{ animationDelay: '-2s' }} /><span aria-hidden className="core-pulse" style={{ animationDelay: '-4s' }} />
        <button type="button" onClick={() => { setPlaying(false); setActive(null); }} className="absolute left-1/2 top-1/2 grid size-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-[#e8401c] via-[#f06a1c] to-amber text-center text-white shadow-[0_0_70px_rgba(240,96,32,.6)] ring-4 ring-white/10 transition hover:scale-105">
          <span><span className="mx-auto mb-1 grid size-10 place-items-center rounded-full bg-white/20"><Compass size={22} /></span><span className="block text-[11px] font-bold uppercase tracking-wide">CEDA Idea Engine</span><span className="block text-[10px] text-white/80">Core Map</span></span>
        </button>
        {NODES.map((n) => {
          const a = (n.angle * Math.PI) / 180;
          const x = 50 + (118 / 400) * 100 * Math.cos(a);
          const y = 50 + (118 / 300) * 100 * Math.sin(a);
          const on = active === n.key;
          return (
            <button key={n.key} type="button" onClick={() => pick(n.key)} aria-pressed={on}
              className={`absolute flex size-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border bg-ink/70 text-white backdrop-blur transition duration-300 ${on ? 'scale-110' : 'hover:scale-105'} ${active && !on ? 'opacity-50' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, borderColor: `${n.tone}${on ? 'ff' : '88'}`, boxShadow: `0 0 ${on ? 40 : 22}px ${n.tone}${on ? '77' : '44'}, inset 0 0 18px ${n.tone}22` }}>
              <span className="grid size-8 place-items-center rounded-lg bg-white/10"><n.icon size={17} style={{ color: n.tone }} /></span>
              <span className="mt-1 text-sm font-bold">{n.label}</span>
              <span className="text-[10px] text-white/55">{n.sections.length} sections</span>
            </button>
          );
        })}
      </div>

      <div className="hidden min-h-[4.5rem] md:block" aria-live="polite">
        {node ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-ink/60 p-3" style={{ borderColor: `${node.tone}88` }}>
            <span className="mr-1 flex items-center gap-2 px-1 font-bold"><node.icon size={16} style={{ color: node.tone }} />{node.label}</span>
            {node.sections.map(([l, h]) => <Link key={l} href={h} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/85 hover:bg-white/20 hover:text-white">{l}<ArrowRight size={12} className="opacity-60" /></Link>)}
            <button type="button" aria-label="Close" onClick={() => { setPlaying(false); setActive(null); }} className="ml-auto text-white/50 hover:text-white"><X size={15} /></button>
          </div>
        ) : <p className="pt-4 text-center text-xs text-white/50">Pick a branch to see its sections.</p>}
      </div>

      {/* Phones: the same branches as a list that opens in place */}
      <div className="my-5 grid gap-2 md:hidden">
        {NODES.map((n) => (
          <div key={n.key} className="rounded-2xl border bg-ink/60" style={{ borderColor: `${n.tone}66` }}>
            <button type="button" onClick={() => pick(n.key)} aria-expanded={active === n.key} className="flex w-full items-center gap-3 p-3 text-left">
              <span className="grid size-9 place-items-center rounded-lg bg-white/10"><n.icon size={18} style={{ color: n.tone }} /></span>
              <span className="flex-1"><b>{n.label}</b><span className="block text-xs text-white/55">{n.sections.length} sections</span></span>
            </button>
            {active === n.key && <ul className="space-y-1 px-3 pb-3">{n.sections.map(([l, h]) => <li key={l}><Link href={h} className="block rounded-lg bg-white/5 px-3 py-2 text-sm text-white/85">{l}</Link></li>)}</ul>}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-white/70"><b className="text-white">Closed-Loop Journey:</b> From 30-sec eligibility to verified certificate and tamper-proof record</p>
        <Link href="/how-it-works" className="inline-flex items-center gap-1 font-bold text-[#f0602a] hover:text-amber">Explore every step of the journey <ArrowRight size={13} /></Link>
      </div>
    </div>
  );
}
