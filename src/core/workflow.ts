import type { Idea, Status } from './types';

/** The five stages the brief names, plus Develop (CEDA: Finance · Develop · Sustain). */
export const STAGES = [
  { key: 'submission', label: 'Submission', blurb: 'Idea received and checked for completeness' },
  { key: 'review', label: 'Review', blurb: 'Independent experts score it against published criteria' },
  { key: 'feedback', label: 'Feedback', blurb: 'Comments come back; you can reply or resubmit' },
  { key: 'approval', label: 'Approval', blurb: 'The committee votes on the scored ideas' },
  { key: 'award', label: 'Award', blurb: 'Funding or recognition is confirmed' },
  { key: 'develop', label: 'Develop', blurb: 'Milestones unlock funding tranches' },
] as const;

export type StageKey = (typeof STAGES)[number]['key'];

export const STATUS_META: Record<Status, { label: string; stage: StageKey | null; tone: string; next: string }> = {
  draft: { label: 'Draft', stage: null, tone: 'slate', next: 'Finish the required fields and submit.' },
  submitted: { label: 'Submitted', stage: 'submission', tone: 'sky', next: 'CEDA checks it is complete (usually within 3 working days).' },
  screening: { label: 'Screening', stage: 'submission', tone: 'sky', next: 'A programme officer is checking eligibility and documents.' },
  in_review: { label: 'In review', stage: 'review', tone: 'violet', next: 'Reviewers are scoring it. You will be notified when feedback is ready.' },
  revision: { label: 'Revision requested', stage: 'feedback', tone: 'amber', next: 'Read the feedback, reply, and resubmit an improved version.' },
  committee: { label: 'At committee', stage: 'approval', tone: 'indigo', next: 'The innovation committee is voting on it.' },
  approved: { label: 'Approved', stage: 'approval', tone: 'emerald', next: 'Awaiting award confirmation and milestone plan.' },
  awarded: { label: 'Awarded', stage: 'award', tone: 'emerald', next: 'Agree your milestone plan to unlock the first tranche.' },
  development: { label: 'In development', stage: 'develop', tone: 'teal', next: 'Deliver milestones; each verified one releases funding.' },
  declined: { label: 'Not selected', stage: null, tone: 'rose', next: 'Read the feedback. You can enter a future call.' },
  withdrawn: { label: 'Withdrawn', stage: null, tone: 'slate', next: '' },
};

export function stageIndex(status: Status, idea?: Idea): number {
  const st = STATUS_META[status].stage;
  if (st) return STAGES.findIndex((s) => s.key === st);
  if (status === 'declined' && idea) {
    // show how far it got before being declined
    const last = [...idea.history].reverse().find((h) => STATUS_META[h.status].stage);
    return last ? STAGES.findIndex((s) => s.key === STATUS_META[last.status].stage) : 0;
  }
  return -1;
}

/** Allowed moves. Anything else is rejected by actions.transition(). */
export const TRANSITIONS: Record<Status, Status[]> = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['screening', 'in_review', 'revision', 'declined', 'withdrawn'],
  screening: ['in_review', 'revision', 'declined', 'withdrawn'],
  in_review: ['committee', 'revision', 'declined', 'withdrawn'],
  revision: ['submitted', 'withdrawn'],
  committee: ['approved', 'revision', 'declined'],
  approved: ['awarded'],
  awarded: ['development'],
  development: [],
  declined: [],
  withdrawn: [],
};

export const ACTIVE: Status[] = ['submitted', 'screening', 'in_review', 'revision', 'committee', 'approved'];
