import Link from 'next/link';
import { eq, asc } from 'drizzle-orm';
import { Search } from 'lucide-react';
import { db, schema } from '@/db';
import { PageHeader, StatusBadge, Notice, StageTrack } from '@/components/ui';
import { STATUS, fmtDateTime } from '@/lib/format';
import { currentStage } from '@/lib/instances';
import { FollowForm } from './follow-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Track an application' };

const PUBLIC_EVENTS: Record<string, string> = { 'entry.submitted': 'Submitted and sealed', 'entry.resubmitted': 'Resubmitted with changes', 'entry.screened': 'Passed screening', 'entry.returned': 'Changes requested', 'entry.assigned': 'Sent to evaluators', 'entry.shortlisted': 'Shortlisted', 'entry.awarded': 'Awarded', 'entry.declined': 'Decision: not funded' };

export default async function Track({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const r = ref?.trim().toUpperCase();
  const [row] = r ? await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(eq(schema.entries.ref, r)).limit(1) : [];
  const found = row && row.e.status !== 'draft';
  const events = found ? (await db.select().from(schema.audit).where(eq(schema.audit.entryId, row.e.id)).orderBy(asc(schema.audit.seq))).filter((a) => PUBLIC_EVENTS[a.action]) : [];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader eyebrow="No sign-in needed" title="Track an application" sub="Enter a reference like CEDA-26-0101. You will see where it is, but never the applicant’s private details." />
      <form className="mb-8 flex gap-2"><input name="ref" defaultValue={ref} className="field mono uppercase" placeholder="CEDA-26-0101" aria-label="Reference" required /><button className="btn-primary"><Search size={16} /> Track</button></form>
      {r && !found && <Notice tone="red">No submitted application has the reference <b className="mono">{r}</b>. Check the code on your receipt.</Notice>}
      {found && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3"><span className="mono text-lg font-bold">{row.e.ref}</span><StatusBadge status={row.e.status} /></div>
            <div className="mt-1 text-sm text-muted">{row.i.name}</div>
            <p className="mt-4 text-lg">{STATUS[row.e.status]?.plain}</p>
            <div className="mt-5"><div className="mb-2 text-sm font-bold">Competition timeline</div><StageTrack stages={row.i.definition.stages} current={currentStage(row.i.definition).index} /></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-5"><h2 className="mb-3 font-bold">History</h2><ol className="space-y-3 border-l-2 border-line pl-4 text-sm">{events.map((a) => <li key={a.seq}><div className="font-semibold">{PUBLIC_EVENTS[a.action]}</div><div className="text-xs text-muted">{fmtDateTime(a.at)} · audit #{a.seq}</div></li>)}</ol></div>
            <div className="card p-5"><h2 className="font-bold">Get free alerts</h2><p className="mb-3 text-sm text-muted">We will email or SMS you each time it moves. Free, and you can stop any time.</p><FollowForm refCode={row.e.ref} /></div>
          </div>
          {row.e.status === 'awarded' && <Notice tone="green">Awarded. <Link className="underline" href={`/certificate/${row.e.ref}`}>View the certificate</Link>.</Notice>}
        </div>
      )}
    </div>
  );
}
