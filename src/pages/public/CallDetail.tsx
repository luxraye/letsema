import { useParams, Link } from 'react-router';
import { CalendarDays, CheckCircle2, FileText, Scale, Download } from 'lucide-react';
import { useStore, useMe, LinkButton, Badge, Empty } from '../../ui/kit';
import { fmtDate, pula, DAY } from '../../core/util';
import { can } from '../../core/rbac';

export default function CallDetail() {
  const { slug } = useParams();
  const s = useStore();
  const me = useMe();
  const c = s.campaigns.find((x) => x.slug === slug && (x.status !== 'draft' || can(s, me, 'campaign.manage')));
  if (!c) return <div className="mx-auto max-w-3xl px-4 py-16"><Empty title="Call not found"><Link to="/calls" className="text-brand underline">See all calls</Link></Empty></div>;
  const total = c.criteria.reduce((a, x) => a + x.weight, 0);
  const days = Math.ceil((new Date(c.closes).getTime() - Date.now()) / DAY);
  const docs = s.documents.filter((d) => d.campaignId === c.id || !d.campaignId);
  const canEnter = c.status === 'open' && (c.track !== 'staff' || me?.staff);
  return (
    <div>
      <div className="border-b border-line" style={{ background: `linear-gradient(135deg, oklch(0.95 0.04 ${c.hue}), var(--paper))` }}>
        <div className="mx-auto max-w-5xl px-4 py-12">
          <Link to="/calls" className="text-sm font-semibold text-brand">← All calls</Link>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="brand">{c.host}</Badge>
            {c.themes.map((t) => <Badge key={t}>{t}</Badge>)}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">{c.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{c.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canEnter ? <LinkButton to={me ? `/app/ideas/new?call=${c.id}` : `/register?next=/app/ideas/new?call=${c.id}`} size="lg">Start your application</LinkButton>
              : <Badge tone="amber">{c.status === 'open' ? 'Only CEDA staff can enter this campaign' : c.status === 'reviewing' ? 'Submissions closed: under review' : 'This call is closed'}</Badge>}
            <span className="text-sm text-muted"><CalendarDays size={15} className="mr-1 inline" />{fmtDate(c.opens)} – {fmtDate(c.closes)}{c.status === 'open' && days > 0 && ` · ${days} days left`}</span>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section><h2 className="text-xl font-bold">About this call</h2><p className="mt-2 leading-relaxed text-ink/85">{c.brief}</p></section>
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold"><Scale size={20} /> How you will be scored</h2>
            <p className="mt-1 text-sm text-muted">Each reviewer scores every criterion from 1 to 5 and must explain each score. Weights are fixed once the call opens.</p>
            <div className="mt-4 space-y-2">
              {c.criteria.map((cr) => (
                <div key={cr.id} className="card flex items-center gap-4 p-4">
                  <div className="w-14 shrink-0 text-center font-display text-2xl font-extrabold text-brand">{Math.round((cr.weight / total) * 100)}%</div>
                  <div><div className="font-semibold">{cr.name}</div><div className="text-sm text-muted">{cr.description}</div></div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-bold">What you will be asked</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {c.form.map((f) => <li key={f.id} className="flex gap-2"><span className={f.required ? 'text-rose-600' : 'text-muted'}>{f.required ? '*' : '○'}</span>{f.label}</li>)}
              {c.documents.map((d) => <li key={d.id} className="flex gap-2"><span className={d.required ? 'text-rose-600' : 'text-muted'}>{d.required ? '*' : '○'}</span>Upload: {d.name} <span className="text-muted">({d.accept}, max {d.maxMb} MB)</span></li>)}
            </ul>
            <p className="mt-2 text-xs text-muted">* required. The form will not submit until these are complete.</p>
          </section>
        </div>
        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold">Who can enter</h3>
            <ul className="mt-3 space-y-2 text-sm">{c.eligibility.map((e) => <li key={e} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />{e}</li>)}</ul>
          </div>
          {c.maxAward > 0 && <div className="card p-5"><h3 className="font-bold">Funding</h3><p className="mt-2 text-sm">Up to <b>{pula(c.maxAward)}</b> per idea from a pool of {pula(c.awardPool)}, paid in milestone tranches.</p></div>}
          <div className="card p-5">
            <h3 className="font-bold">Process</h3>
            <ol className="mt-3 space-y-1.5 text-sm text-muted">
              {c.levels.screening && <li>1. Completeness & eligibility screening</li>}
              <li>{c.levels.screening ? 2 : 1}. Blind review by {c.levels.reviewersPerIdea} independent reviewers</li>
              <li>{c.levels.screening ? 3 : 2}. Feedback; revision if requested</li>
              <li>{c.levels.screening ? 4 : 3}. Committee vote (quorum {c.levels.committeeQuorum})</li>
              <li>{c.levels.screening ? 5 : 4}. Award and milestone plan</li>
            </ol>
          </div>
          {docs.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold">Documents</h3>
              <ul className="mt-3 space-y-2 text-sm">{docs.map((d) => <li key={d.id} className="flex items-center gap-2"><FileText size={16} className="text-brand" /><span className="flex-1">{d.name}</span><Download size={14} className="text-muted" /></li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
