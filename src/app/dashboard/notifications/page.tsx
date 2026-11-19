import Link from 'next/link';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Empty } from '@/components/ui';
import { ago } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Notifications() {
  const me = await requireUser();
  const rows = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, me.id)).orderBy(desc(schema.notifications.createdAt)).limit(100);
  await db.update(schema.notifications).set({ readAt: new Date() }).where(and(eq(schema.notifications.userId, me.id), isNull(schema.notifications.readAt)));
  return (
    <div>
      <PageHeader title="Notifications" sub="Choose email, SMS or in-app alerts in your profile." />
      {rows.length === 0 ? <Empty title="Nothing yet" /> : <div className="card divide-y divide-line">{rows.map((n) => <Link key={n.id} href={n.link ?? '#'} className={`block p-4 hover:bg-sand/50 ${n.readAt ? '' : 'bg-[var(--brand)]/5'}`}><div className="font-semibold">{n.title}</div><div className="text-sm text-muted">{n.body}</div><div className="text-xs text-muted">{ago(n.createdAt)}</div></Link>)}</div>}
    </div>
  );
}
