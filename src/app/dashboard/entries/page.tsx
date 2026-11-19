import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, StatusBadge, Empty } from '@/components/ui';
import { ago } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function MyEntries() {
  const me = await requireUser({ perm: 'entry.create' });
  const rows = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(eq(schema.entries.innovatorId, me.id)).orderBy(desc(schema.entries.updatedAt));
  return (
    <div>
      <PageHeader title="My applications" actions={<Link href="/instances" className="btn-primary">Find a competition</Link>} />
      {rows.length === 0 ? <Empty title="No applications yet" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-muted"><tr><th className="p-3">Application</th><th className="p-3">Competition</th><th className="p-3">Status</th><th className="p-3">Updated</th></tr></thead>
            <tbody className="divide-y divide-line">{rows.map(({ e, i }) => <tr key={e.id} className="hover:bg-sand/40"><td className="p-3"><Link className="font-semibold hover:underline" href={`/dashboard/entries/${e.id}`}>{e.title}</Link><div className="mono text-xs text-muted">{e.ref}</div></td><td className="p-3 text-muted">{i.name}</td><td className="p-3"><StatusBadge status={e.status} /></td><td className="p-3 text-muted">{ago(e.updatedAt)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
