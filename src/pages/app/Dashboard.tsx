import { Link } from 'react-router';
import { AlertTriangle, ArrowRight, ClipboardCheck, Clock, FileCheck2, Link2, MessageSquare, Plus, ShieldCheck, Users } from 'lucide-react';
import { useMe, useStore, PageHeader, LinkButton, Stat, StageTrack, StatusBadge, Section, Badge, Bars } from '../../ui/kit';
import { can, roleDef } from '../../core/rbac';
import { verifyChain } from '../../core/store';
import { STATUS_META, STAGES } from '../../core/workflow';
import { ideaScore } from '../../core/scoring';
import { availability } from '../../core/hours';
import { ago, pula } from '../../core/util';

export default function Dashboard() {
  const me = useMe()!;
  const s = useStore();
  const first = me.name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\.? /, '').split(' ')[0];
  const hour = (new Date().getUTCHours() + 2) % 24;
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const role = roleDef(s, me.role);
  return (
    <div>
      <PageHeader eyebrow={role?.label} title={`${greet}, ${first}`} sub={role?.description} />
      {can(s, me, 'idea.create') && <InnovatorHome />}
      {can(s, me, 'review.submit') && <ReviewerHome />}
      {can(s, me, 'idea.view.pipeline') && <CommitteeHome />}
      {can(s, me, 'chat.answer') && !can(s, me, 'idea.view.pipeline') && <ConsultantHome />}
      {can(s, me, 'audit.view') && <AdminHome />}
    </div>
  );

  function InnovatorHome() {
    const mine = s.ideas.filter((i) => i.ownerId === me.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const needs = mine.filter((i) => i.status === 'revision' || i.status === 'draft' || i.milestones.some((m) => m.status === 'in_progress'));
    const open = s.campaigns.filter((c) => c.status === 'open' && (c.track !== 'staff' || me.staff));
    return (
      <div className="space-y-6">
        {needs.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-950"><AlertTriangle size={18} /> Needs your attention</div>
            <ul className="mt-2 space-y-1 text-sm">{needs.map((i) => <li key={i.id}><Link className="font-semibold underline" to={i.status === 'draft' ? `/app/ideas/${i.id}/edit` : `/app/ideas/${i.id}`}>{i.title || 'Untitled draft'}</Link>: {i.status === 'revision' ? 'reviewers asked for a revision' : i.status === 'draft' ? 'draft not yet submitted' : 'a milestone is in progress'}</li>)}</ul>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {mine.filter((i) => i.status !== 'draft').slice(0, 4).map((i) => (
            <Link key={i.id} to={`/app/ideas/${i.id}`} className="card p-5 transition hover:border-brand">
              <div className="flex items-start justify-between gap-2"><div className="font-bold">{i.title}</div><StatusBadge status={i.status} /></div>
              <div className="mt-4"><StageTrack idea={i} /></div>
              <p className="mt-3 text-sm text-muted">{STATUS_META[i.status].next}</p>
            </Link>
          ))}
        </div>
        <Section title="Open calls you can enter" action={<LinkButton to="/app/ideas/new" size="sm"><Plus size={15} /> New idea</LinkButton>}>
          <ul className="divide-y divide-line">{open.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 py-2.5"><Link to={`/calls/${c.slug}`} className="font-semibold hover:text-brand">{c.title}</Link><Link to={`/app/ideas/new?call=${c.id}`} className="text-sm font-semibold text-brand">Apply →</Link></li>)}</ul>
        </Section>
      </div>
    );
  }

  function ReviewerHome() {
    const queue = s.ideas.filter((i) => i.status === 'in_review' && i.assignments.some((a) => a.reviewerId === me.id && !a.conflict?.declared) && !i.reviews.some((r) => r.reviewerId === me.id && r.round === i.round));
    const overdue = queue.filter((i) => new Date(i.assignments.find((a) => a.reviewerId === me.id)!.dueAt).getTime() < Date.now());
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Waiting for your score" value={queue.length} icon={<ClipboardCheck size={16} />} />
          <Stat label="Overdue" value={overdue.length} icon={<Clock size={16} />} />
          <Stat label="Reviews written" value={s.ideas.reduce((a, i) => a + i.reviews.filter((r) => r.reviewerId === me.id).length, 0)} icon={<FileCheck2 size={16} />} />
        </div>
        <LinkButton to="/app/review">Open review queue <ArrowRight size={16} /></LinkButton>
      </div>
    );
  }

  function CommitteeHome() {
    const atCommittee = s.ideas.filter((i) => i.status === 'committee');
    const toVote = atCommittee.filter((i) => !i.decision?.votes?.[me.id]);
    const split = atCommittee.filter((i) => ideaScore(s, i).disagreement);
    const live = s.ideas.filter((i) => !['draft', 'withdrawn'].includes(i.status));
    const awarded = s.ideas.filter((i) => i.award).reduce((a, i) => a + (i.award?.amount ?? 0), 0);
    return (
      <div className="mt-2 space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="At committee" value={atCommittee.length} />
          <Stat label={can(s, me, 'idea.decide') ? 'Awaiting your vote' : 'Decisions pending'} value={can(s, me, 'idea.decide') ? toVote.length : atCommittee.length} />
          <Stat label="Reviewer disagreements" value={split.length} hint="Flagged for discussion" />
          <Stat label="Awarded to date" value={pula(awarded)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Ready for a decision">
            <ul className="divide-y divide-line">{atCommittee.map((i) => { const sc = ideaScore(s, i); return (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5"><Link to={`/app/ideas/${i.id}`} className="min-w-0 truncate font-semibold hover:text-brand">{i.title}</Link><span className="flex shrink-0 gap-1">{sc.disagreement && <Badge tone="amber">split</Badge>}<Badge tone="brand">{sc.calibrated}</Badge>{i.decision?.votes?.[me.id] && <Badge tone="emerald">voted</Badge>}</span></li>
            ); })}</ul>
          </Section>
          <Section title="Pipeline right now" action={<Link to="/app/pipeline" className="text-sm font-semibold text-brand">Board →</Link>}>
            <Bars data={STAGES.map((st) => ({ label: st.label, value: live.filter((i) => STATUS_META[i.status].stage === st.key).length }))} />
          </Section>
        </div>
      </div>
    );
  }

  function ConsultantHome() {
    const waiting = s.conversations.filter((c) => c.status === 'waiting');
    const active = s.conversations.filter((c) => c.status === 'active' && c.agentId === me.id);
    const av = availability(new Date(), s.settings.chat);
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Waiting" value={waiting.length} icon={<MessageSquare size={16} />} />
          <Stat label="Your active chats" value={active.length} hint={`Up to ${s.settings.chat.maxPerAgent} at once`} />
          <Stat label="Chat is" value={av.open ? 'Open' : 'Closed'} hint={av.local} />
        </div>
        <LinkButton to="/app/chat">Open chat console <ArrowRight size={16} /></LinkButton>
      </div>
    );
  }

  function AdminHome() {
    const chain = verifyChain(s.audit);
    const toScreen = s.ideas.filter((i) => ['submitted', 'screening'].includes(i.status));
    const overdue = s.ideas.filter((i) => i.status === 'in_review' && i.assignments.some((a) => !a.conflict?.declared && new Date(a.dueAt).getTime() < Date.now() && !i.reviews.some((r) => r.reviewerId === a.reviewerId && r.round === i.round)));
    const evidence = s.ideas.filter((i) => i.milestones.some((m) => m.status === 'evidence'));
    const privacy = s.privacy.filter((p) => p.status === 'open');
    return (
      <div className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="To screen" value={toScreen.length} icon={<FileCheck2 size={16} />} />
          <Stat label="Overdue reviews" value={overdue.length} icon={<Clock size={16} />} />
          <Stat label="Users" value={s.users.length} icon={<Users size={16} />} />
          <Stat label="Audit chain" value={chain.ok ? 'Intact' : `Broken at #${chain.brokenAt}`} icon={chain.ok ? <ShieldCheck size={16} /> : <Link2 size={16} />} hint={`${chain.checked} linked entries`} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Screening queue (level 1)">
            <ul className="divide-y divide-line">{toScreen.slice(0, 8).map((i) => <li key={i.id} className="flex items-center justify-between gap-3 py-2.5"><Link to={`/app/ideas/${i.id}`} className="min-w-0 truncate font-semibold hover:text-brand">{i.title}</Link><span className="text-xs text-muted">{ago(i.updatedAt)}</span></li>)}{!toScreen.length && <li className="py-2 text-sm text-muted">Nothing waiting.</li>}</ul>
          </Section>
          <Section title="Also waiting on you">
            <ul className="space-y-2 text-sm">
              <li>{evidence.length} milestone{evidence.length === 1 ? '' : 's'} with evidence to verify {evidence[0] && <Link className="font-semibold text-brand" to={`/app/ideas/${evidence[0].id}`}>→ first one</Link>}</li>
              <li>{privacy.length} open data-protection request{privacy.length === 1 ? '' : 's'} <Link className="font-semibold text-brand" to="/app/privacy">→ desk</Link></li>
              <li>{s.conversations.filter((c) => c.status === 'missed').length} after-hours chat messages to follow up <Link className="font-semibold text-brand" to="/app/chat">→ chat</Link></li>
            </ul>
          </Section>
        </div>
      </div>
    );
  }
}
