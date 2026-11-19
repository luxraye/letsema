import { Link } from 'react-router';
import { ArrowRight, EyeOff, Scale, Receipt, Link2, ShieldCheck, Building2, Search, Sprout, Users } from 'lucide-react';
import { useStore, LinkButton, Badge } from '../../ui/kit';
import { STAGES, STATUS_META } from '../../core/workflow';
import { fmtDate, pula, DAY } from '../../core/util';
import { t } from '../../ui/i18n';
import type { Campaign } from '../../core/types';

export function Home() {
  const s = useStore();
  const open = s.campaigns.filter((c) => c.status === 'open' && c.track !== 'staff');
  const live = s.ideas.filter((i) => i.status !== 'draft' && i.status !== 'withdrawn');
  const byStage = STAGES.map((st) => live.filter((i) => STATUS_META[i.status].stage === st.key));
  const funded = s.ideas.filter((i) => i.award);
  const awarded = funded.reduce((a, i) => a + (i.award?.amount ?? 0), 0);
  const districts = new Set(live.map((i) => i.district)).size;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="furrows absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="rise">
            <Badge tone="brand" className="mb-5">Citizen Entrepreneurial Development Agency</Badge>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              {t('Every idea gets a fair hearing.')}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Submit your idea to CEDA in one guided form. Independent reviewers score it without seeing your name, you get feedback on every criterion, and you can follow it from submission to funding, step by step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to="/calls" size="lg">{t('Submit an idea')} <ArrowRight size={18} /></LinkButton>
              <LinkButton to="/track" variant="secondary" size="lg"><Search size={18} /> {t('Track an idea')}</LinkButton>
            </div>
            <p className="mt-4 text-sm text-muted">Free to enter · Works on any phone · Live chat 09:00–16:00 on working days</p>
          </div>

          <div className="rise card relative p-5 shadow-xl" style={{ animationDelay: '.1s' }} aria-label="Live pipeline">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand">Live pipeline</div>
                <div className="font-display text-lg font-bold">{live.length} ideas moving through CEDA</div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted"><span className="live-dot h-2 w-2 rounded-full bg-emerald-500" /> updates live</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {STAGES.map((st, i) => (
                <div key={st.key} className="flex flex-col">
                  <div className="flex h-44 flex-col-reverse flex-wrap content-start gap-1 rounded-xl bg-paper p-1.5">
                    {byStage[i]!.slice(0, 24).map((idea) => (
                      <Link key={idea.id} to={`/track/${idea.ref}`} title={`${idea.ref}: ${STATUS_META[idea.status].label}`}
                        className={`h-3.5 w-3.5 rounded-full transition hover:scale-125 ${idea.status === 'revision' ? 'bg-amber-500' : i >= 4 ? 'bg-accent' : 'bg-brand'}`} aria-label={`${idea.ref} ${STATUS_META[idea.status].label}`} />
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-display text-xl font-extrabold">{byStage[i]!.length}</div>
                    <div className="text-[11px] font-semibold leading-tight text-muted">{t(st.label)}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Each dot is a real application. Click one to see its public status. <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> amber = waiting on the innovator’s revision.</span></p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            [String(open.length), 'calls open now'],
            [String(live.length), 'ideas submitted'],
            [String(districts), 'districts represented'],
            [pula(awarded), 'awarded, paid by milestone'],
          ].map(([v, l]) => (
            <div key={l} className="card p-5"><div className="font-display text-3xl font-extrabold">{v}</div><div className="text-sm text-muted">{l}</div></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold">Open calls</h2>
          <Link to="/calls" className="text-sm font-semibold text-brand hover:underline">All calls →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {open.map((c) => <CallCard key={c.id} c={c} count={s.ideas.filter((i) => i.campaignId === c.id && i.status !== 'draft').length} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-extrabold">What happens after you press submit</h2>
        <p className="mt-1 text-muted">The same six stages for every idea, shown on your idea page and on the public tracker.</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {STAGES.map((st, i) => (
            <li key={st.key} className="card relative p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand font-bold text-brand-ink">{i + 1}</div>
              <div className="font-bold">{t(st.label)}</div>
              <p className="mt-1 text-sm text-muted">{st.blurb}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-extrabold">Fair by design, not by promise</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [<EyeOff key="a" />, 'Blind review', 'Reviewers never see your name, company or district. They judge the idea.'],
              [<Scale key="b" />, 'Calibrated scores', 'Some reviewers mark harder than others. Letsema corrects for it so luck of the draw does not decide your result.'],
              [<Users key="c" />, 'Conflict declarations', 'Every reviewer confirms they have no conflict before an idea opens. A declared conflict reassigns it automatically.'],
              [<Receipt key="d" />, 'Signed receipts', 'You get a fingerprinted receipt of exactly what you submitted. Anyone can check it.'],
              [<Link2 key="e" />, 'Tamper-evident record', 'Every action is written to a hash-chained audit trail. Editing history breaks the chain, visibly.'],
              [<ShieldCheck key="f" />, 'Your data, your rights', 'Built for the Data Protection Act, 2024: consent, download your data, correction and erasure.'],
            ].map(([icon, title, body]) => (
              <div key={title as string} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{icon}</div>
                <div><div className="font-bold">{title}</div><p className="text-sm text-muted">{body}</p></div>
              </div>
            ))}
          </div>
          <Link to="/how" className="mt-8 inline-flex items-center gap-1 font-semibold text-brand hover:underline">See exactly how evaluation works <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 lg:grid-cols-2">
        <div className="card p-6">
          <Building2 className="text-brand" />
          <h3 className="mt-3 text-xl font-extrabold">Innovation inside CEDA too</h3>
          <p className="mt-2 text-muted">Staff-only campaigns let CEDA employees propose improvements to how the Agency serves clients. Same fair process, scored on customer impact and time saved.</p>
          <Link to="/calls" className="mt-4 inline-flex font-semibold text-brand hover:underline">See staff campaigns →</Link>
        </div>
        <div className="card p-6">
          <Sprout className="text-brand" />
          <h3 className="mt-3 text-xl font-extrabold">Awards that grow into businesses</h3>
          <p className="mt-2 text-muted">Funding is released in tranches as agreed milestones are verified, so support continues after the award. {funded.length} ventures are being developed now.</p>
          <Link to="/ideas" className="mt-4 inline-flex font-semibold text-brand hover:underline">Browse funded ideas →</Link>
        </div>
      </section>
    </>
  );
}

export function CallCard({ c, count }: { c: Campaign; count: number }) {
  const days = Math.ceil((new Date(c.closes).getTime() - Date.now()) / DAY);
  return (
    <Link to={`/calls/${c.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-2" style={{ background: `oklch(0.6 0.13 ${c.hue})` }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={c.track === 'staff' ? 'accent' : c.track === 'partner' ? 'violet' : 'brand'}>{c.track === 'staff' ? 'CEDA staff only' : c.track === 'partner' ? 'Partner call' : 'Public call'}</Badge>
          {c.status === 'open' ? <Badge tone={days <= 14 ? 'amber' : 'emerald'}>{days > 0 ? `Closes in ${days} days` : 'Closing today'}</Badge> : <Badge>{c.status === 'reviewing' ? 'Under review' : c.status === 'closed' ? 'Closed' : 'Draft'}</Badge>}
        </div>
        <h3 className="mt-3 text-lg font-extrabold group-hover:text-brand">{c.title}</h3>
        <p className="mt-1 flex-1 text-sm text-muted">{c.summary}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {c.maxAward > 0 && <span><b>Up to {pula(c.maxAward)}</b></span>}
          <span className="text-muted">{count} entries</span>
          <span className="text-muted">Closes {fmtDate(c.closes)}</span>
        </div>
      </div>
    </Link>
  );
}
