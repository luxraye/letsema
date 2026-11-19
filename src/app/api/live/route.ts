import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ stamp: 'anon' });
  const r = await db.execute<{ e: string | null; n: string | null; c: string | null; m: string | null; a: number }>(sql`
    select (select max(updated_at)::text from entries) e,
           (select max(created_at)::text from notifications where user_id = ${me.id}) n,
           (select max(created_at)::text from chat_messages) c,
           (select max(created_at)::text from messages) m,
           (select max(seq) from audit) a`);
  const row = r.rows[0];
  return NextResponse.json({ stamp: `${row.e}|${row.n}|${row.c}|${row.m}|${row.a}` });
}
