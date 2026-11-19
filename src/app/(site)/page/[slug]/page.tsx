import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { PageHeader } from '@/components/ui';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Pages written by admins in Content. Plain text with paragraphs; no HTML, so nothing can be injected. */
export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p] = await db.select().from(schema.content).where(and(eq(schema.content.kind, 'page'), eq(schema.content.slug, slug), eq(schema.content.published, true))).limit(1);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title={p.title} sub={`Last updated ${fmtDate(p.updatedAt)}`} />
      <div className="space-y-4 text-[15px] leading-relaxed">{p.body.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}</div>
    </div>
  );
}
