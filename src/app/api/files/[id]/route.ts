import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { currentUser } from '@/lib/session';
import { can } from '@/lib/rbac';

/** Download an uploaded file. Allowed for the owner, staff who can see all entries, and evaluators assigned to it. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return new Response('Sign in first', { status: 401 });
  const [f] = await db.select({ f: schema.entryFiles, owner: schema.entries.innovatorId }).from(schema.entryFiles).innerJoin(schema.entries, eq(schema.entries.id, schema.entryFiles.entryId)).where(eq(schema.entryFiles.id, id)).limit(1);
  if (!f) return new Response('Not found', { status: 404 });
  let ok = f.owner === me.id || can(me.role, 'entry.viewAll');
  if (!ok && can(me.role, 'entry.review')) { const [ev] = await db.select().from(schema.evaluations).where(and(eq(schema.evaluations.entryId, f.f.entryId), eq(schema.evaluations.evaluatorId, me.id))).limit(1); ok = !!ev && ev.conflict === false; }
  if (!ok) return new Response('Not allowed', { status: 403 });
  const safeName = f.f.name.replace(/[^\w.\- ]/g, '_');
  return new Response(new Uint8Array(f.f.content), { headers: { 'content-type': f.f.detected === 'pdf' ? 'application/pdf' : 'application/octet-stream', 'content-disposition': `attachment; filename="${safeName}"`, 'x-content-type-options': 'nosniff', 'cache-control': 'private, no-store' } });
}
