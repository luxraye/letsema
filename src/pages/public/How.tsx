import { EyeOff, Scale, Users, MessageSquareReply, Gavel, Sprout, AlertTriangle } from 'lucide-react';
import { PageHeader, LinkButton } from '../../ui/kit';

const STEPS = [
  { icon: <Users />, title: '1. Submit', body: 'A guided form with compulsory fields. It saves as you type (even offline), checks every required answer and document, warns you if a similar idea already exists so you can collaborate instead of duplicating, and gives you a fingerprinted receipt.' },
  { icon: <AlertTriangle />, title: '2. Screen', body: 'A programme officer checks completeness and eligibility with a fixed checklist. If something is missing, the idea comes back to you with a note; it is not silently rejected.' },
  { icon: <EyeOff />, title: '3. Blind review', body: 'Reviewers are matched by expertise and workload. Each one declares any conflict of interest before the idea opens, then scores every criterion from 1 to 5 with a written reason, without seeing who you are.' },
  { icon: <Scale />, title: '4. Calibrate', body: 'Scores are combined using the published weights. Letsema then adjusts for each reviewer’s personal strictness (a z-score against their own history), and flags ideas where reviewers disagree strongly so the committee discusses them.' },
  { icon: <MessageSquareReply />, title: '5. Feedback & resubmit', body: 'You see every criterion comment. You can reply in a thread, and if a revision is requested you resubmit; reviewers see a side-by-side of exactly what changed, and the same reviewers re-score it.' },
  { icon: <Gavel />, title: '6. Committee', body: 'Internal and external committee members see calibrated rankings, reviewer comments and disagreement flags. They vote; a decision needs quorum and a written reason, which is shared with you.' },
  { icon: <Sprout />, title: '7. Award & develop', body: 'Awards are paid in tranches. Each milestone you deliver is verified before the next tranche is released, and you can see the plan the whole time.' },
];

export default function How() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="How it works" title="A fair, visible process for every idea" sub="The same multi-level workflow runs every call. Calls can change the form, criteria, weights and number of reviewers, but not the fairness rules." />
      <ol className="space-y-3">
        {STEPS.map((s) => (
          <li key={s.title} className="card flex gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{s.icon}</div>
            <div><h2 className="text-lg font-bold">{s.title}</h2><p className="mt-1 text-ink/80">{s.body}</p></div>
          </li>
        ))}
      </ol>
      <div className="card mt-8 p-6">
        <h2 className="text-lg font-bold">The maths, in one paragraph</h2>
        <p className="mt-2 text-sm text-ink/80">For one review, the score is Σ(score ÷ 5 × weight) ÷ Σweight × 100. For calibration, each reviewer’s scores are standardised against their own mean and spread (once they have at least three reviews) and mapped back onto the panel-wide mean and spread. A disagreement flag is raised when reviewers on the same idea are further apart than the call’s threshold (for example 18 points). Raw and calibrated scores are both shown; the committee decides.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3"><LinkButton to="/calls">See open calls</LinkButton><LinkButton to="/judges" variant="secondary">Try it as each role</LinkButton></div>
    </div>
  );
}
