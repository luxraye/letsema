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

/**
 * Inclusion snapshot for the home page: registered innovators by age bracket and gender.
 * Only totals leave the database, and both fields are optional, so "not stated" is shown too.
 */
export async function inclusionStats() {
  const rows = await db.select({ dob: schema.users.dateOfBirth, gender: schema.users.gender }).from(schema.users).where(eq(schema.users.role, 'innovator'));
  const now = new Date();
  const ageOf = (dob: string) => { const d = new Date(dob); if (Number.isNaN(+d)) return null; let a = now.getFullYear() - d.getFullYear(); if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
  const ages = { '18–24': 0, '25–29': 0, '30–35': 0, '36 and over': 0, 'Not stated': 0 };
  const gender = { Women: 0, Men: 0, 'Not stated': 0 };
  for (const r of rows) {
    const a = r.dob ? ageOf(r.dob) : null;
    if (a == null || a < 18) ages['Not stated']++;
    else if (a <= 24) ages['18–24']++;
    else if (a <= 29) ages['25–29']++;
    else if (a <= 35) ages['30–35']++;
    else ages['36 and over']++;
    if (r.gender === 'Female') gender.Women++; else if (r.gender === 'Male') gender.Men++; else gender['Not stated']++;
  }
  const youth = ages['18–24'] + ages['25–29'] + ages['30–35'];
  return { total: rows.length, ages, gender, youth };
}
