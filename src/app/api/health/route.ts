import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

/** Health check for uptime monitors and the load balancer. */
export async function GET() {
  const t = performance.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: 'up', dbMs: Math.round((performance.now() - t) * 10) / 10, uptimeS: Math.round(process.uptime()), at: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
