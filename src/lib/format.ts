export const fmtDate = (d: Date | string | null | undefined) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Gaborone' }) : '–';
export const fmtDateTime = (d: Date | string | null | undefined) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Gaborone' }) : '–';
export function ago(d: Date | string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
}
export const STATUS: Record<string, { label: string; tone: string; plain: string }> = {
  draft: { label: 'Draft', tone: 'gray', plain: 'Not sent yet. Only you can see it.' },
  submitted: { label: 'Submitted', tone: 'blue', plain: 'Received and sealed. Checks run next.' },
  screening: { label: 'Screening', tone: 'blue', plain: 'CEDA is checking eligibility and completeness.' },
  in_review: { label: 'With evaluators', tone: 'amber', plain: 'Independent evaluators are scoring it, without seeing your name.' },
  returned: { label: 'Changes requested', tone: 'orange', plain: 'Read the feedback, update and resubmit.' },
  shortlisted: { label: 'Shortlisted', tone: 'violet', plain: 'Among the best. The panel decides next.' },
  awarded: { label: 'Awarded', tone: 'green', plain: 'Funding approved. Your certificate is ready.' },
  declined: { label: 'Not funded', tone: 'red', plain: 'Not funded this round. Feedback explains why.' },
  withdrawn: { label: 'Withdrawn', tone: 'gray', plain: 'You withdrew this application.' },
};
