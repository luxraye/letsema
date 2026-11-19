import { and, eq, ne } from 'drizzle-orm';
import { db, schema } from '@/db';
import { apiKey, unauthorised } from '@/lib/api-auth';
import { ENTRY_STATUSES } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const key = await apiKey(req);
  if (!key) return unauthorised();
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status');
  if (status && !(ENTRY_STATUSES as readonly string[]).includes(status)) return Response.json({ error: 'Unknown status' }, { status: 400 });
  const rows = await db.select({ ref: schema.entries.ref, title: schema.entries.title, instance: schema.instances.slug, status: schema.entries.status, sector: schema.entries.sector, district: schema.entries.district, score: schema.entries.score, rank: schema.entries.rank, award: schema.entries.awardAmount, submittedAt: schema.entries.submittedAt, decidedAt: schema.entries.decidedAt })
    .from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId))
    .where(and(ne(schema.entries.status, 'draft'), key.spaceId ? eq(schema.instances.spaceId, key.spaceId) : undefined, sp.get('instance') ? eq(schema.instances.slug, sp.get('instance')!) : undefined, status ? eq(schema.entries.status, status as never) : undefined))
    .limit(500);
  return Response.json({ data: rows, count: rows.length });
}
