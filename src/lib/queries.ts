import { and, desc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';

export async function publicStats() {
  const [live] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.instances).where(eq(schema.instances.status, 'live'));
  const [subs] = await db.select({ n: sql<number>`count(*)::int`, districts: sql<number>`count(distinct ${schema.entries.district})::int` }).from(schema.entries).where(ne(schema.entries.status, 'draft'));
  const [awarded] = await db.select({ n: sql<number>`count(*)::int`, sum: sql<number>`coalesce(sum(${schema.entries.awardAmount}),0)::int` }).from(schema.entries).where(eq(schema.entries.status, 'awarded'));
  const pipeline = await db.select({ status: schema.entries.status, n: sql<number>`count(*)::int` }).from(schema.entries).where(ne(schema.entries.status, 'draft')).groupBy(schema.entries.status);
  return { live: live.n, submitted: subs.n, districts: subs.districts, awarded: awarded.n, awardedSum: awarded.sum, pipeline };
}

export async function liveInstances(includeStaff = false) {
  const rows = await db.select({ i: schema.instances, space: schema.spaces }).from(schema.instances)
    .innerJoin(schema.spaces, eq(schema.spaces.id, schema.instances.spaceId))
    .where(inArray(schema.instances.status, ['live', 'closed'])).orderBy(desc(schema.instances.featured), schema.instances.closesAt);
  const counts = await db.select({ id: schema.entries.instanceId, n: sql<number>`count(*)::int` }).from(schema.entries).where(ne(schema.entries.status, 'draft')).groupBy(schema.entries.instanceId);
  const c = new Map(counts.map((x) => [x.id, x.n]));
  return rows.filter((r) => includeStaff || r.i.definition.audience !== 'staff').map((r) => ({ ...r, entries: c.get(r.i.id) ?? 0 }));
}

export async function showcase() {
  return db.select({ e: schema.entries, instance: schema.instances.name }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId))
    .where(and(eq(schema.entries.status, 'awarded'), eq(schema.entries.showcase, true), isNotNull(schema.entries.awardAmount))).orderBy(desc(schema.entries.decidedAt));
}
