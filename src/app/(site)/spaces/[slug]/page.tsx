import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { PageHeader, Empty } from '@/components/ui';
import { InstanceCard } from '@/components/instance-card';
import { liveInstances } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function Space({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [space] = await db.select().from(schema.spaces).where(eq(schema.spaces.slug, slug)).limit(1);
  if (!space || !space.active) notFound();
  const all = await db.select({ slug: schema.spaces.slug, short: schema.spaces.short }).from(schema.spaces).where(eq(schema.spaces.active, true));
  const list = (await liveInstances()).filter((x) => x.space.id === space.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-wrap gap-2 text-sm">{all.map((s) => <Link key={s.slug} href={`/spaces/${s.slug}`} className={`chip border !py-1.5 ${s.slug === slug ? 'border-ink bg-ink text-white' : 'border-line bg-surface'}`}>{s.short}</Link>)}</div>
      <div className="mb-8 h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${space.primary}, ${space.accent})` }} />
      <PageHeader eyebrow="Space" title={space.name} sub={space.about || 'Competitions run in this space, on the same portal and the same rules.'} />
      {list.length === 0 ? <Empty title="No open competitions here right now" /> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.map((x) => <InstanceCard key={x.i.id} x={x} />)}</div>}
    </div>
  );
}
