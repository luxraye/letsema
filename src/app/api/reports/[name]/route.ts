import { and, eq, ne } from 'drizzle-orm';
import { db, schema } from '@/db';
import { currentUser } from '@/lib/session';
import { can } from '@/lib/rbac';
import { toCsv } from '@/lib/csv';
import { appendAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const me = await currentUser();
  if (!me || !can(me.role, 'reports.view')) return new Response('Not allowed', { status: 403 });
  const { name } = await params; const sp = new URL(req.url).searchParams;
  let rows: Record<string, unknown>[] = [];
  if (name === 'entries.csv') {
    const r = await db.select({ ref: schema.entries.ref, title: schema.entries.title, competition: schema.instances.name, status: schema.entries.status, sector: schema.entries.sector, district: schema.entries.district, score: schema.entries.score, rank: schema.entries.rank, award: schema.entries.awardAmount, submitted: schema.entries.submittedAt, decided: schema.entries.decidedAt }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId))
      .where(and(ne(schema.entries.status, 'draft'), sp.get('status') ? eq(schema.entries.status, sp.get('status') as never) : undefined, sp.get('instance') ? eq(schema.entries.instanceId, sp.get('instance')!) : undefined, me.role === 'partner_admin' && me.spaceId ? eq(schema.instances.spaceId, me.spaceId) : undefined));
    rows = r;
  } else if (name === 'chats.csv') {
    rows = await db.select({ id: schema.chats.id, topic: schema.chats.topic, status: schema.chats.status, started: schema.chats.createdAt, firstReply: schema.chats.firstReplyAt, closed: schema.chats.closedAt, rating: schema.chats.rating }).from(schema.chats);
  } else return new Response('Unknown report', { status: 404 });
  await appendAudit({ actorId: me.id, actorName: me.name, action: 'report.exported', detail: { report: name, rows: rows.length } });
  return new Response(toCsv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` } });
}
