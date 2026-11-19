import { notFound, redirect } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { Editor } from './editor';

export const dynamic = 'force-dynamic';

export default async function EditEntry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser({ perm: 'entry.create' });
  const [row] = await db.select({ e: schema.entries, i: schema.instances }).from(schema.entries).innerJoin(schema.instances, eq(schema.instances.id, schema.entries.instanceId)).where(and(eq(schema.entries.id, id), eq(schema.entries.innovatorId, me.id))).limit(1);
  if (!row) notFound();
  if (!['draft', 'returned'].includes(row.e.status)) redirect(`/dashboard/entries/${id}`);
  const files = await db.select({ field: schema.entryFiles.field, name: schema.entryFiles.name, size: schema.entryFiles.size, sha256: schema.entryFiles.sha256, pages: schema.entryFiles.pages }).from(schema.entryFiles).where(eq(schema.entryFiles.entryId, id));
  const feedback = row.e.status === 'returned' ? await db.select().from(schema.messages).where(and(eq(schema.messages.entryId, id), eq(schema.messages.kind, 'revision_request'))).orderBy(desc(schema.messages.createdAt)).limit(1) : [];
  return <Editor entry={{ id: row.e.id, ref: row.e.ref, status: row.e.status, title: row.e.title, summary: row.e.summary, sector: row.e.sector ?? '', answers: row.e.answers, team: row.e.team, version: row.e.version, updatedAt: row.e.updatedAt.toISOString() }} instance={{ name: row.i.name, slug: row.i.slug, def: row.i.definition }} files={files} revision={feedback[0]?.body} />;
}
