import { and, eq, ilike, inArray, or } from 'drizzle-orm';
import { db, schema } from '@/db';
import { PAGES, EXTRA_PAGES } from '@/lib/site-map';

type Hit = { href: string; title: string; text: string; group: string };

/** Public site search: pages, competitions, funded ideas, FAQs and an application reference. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 60);
  if (q.length < 2) return Response.json({ hits: [] });
  const low = q.toLowerCase();
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const pages: Hit[] = [...PAGES, ...EXTRA_PAGES].filter((p) => `${p.title} ${p.text}`.toLowerCase().includes(low)).map(({ href, title, text, group }) => ({ href, title, text, group }));
  const [inst, funded, faqs] = await Promise.all([
    db.select({ slug: schema.instances.slug, name: schema.instances.name, tagline: schema.instances.tagline, def: schema.instances.definition }).from(schema.instances)
      .where(and(inArray(schema.instances.status, ['live', 'closed']), or(ilike(schema.instances.name, like), ilike(schema.instances.tagline, like)))).limit(6),
    db.select({ ref: schema.entries.ref, title: schema.entries.title, summary: schema.entries.summary }).from(schema.entries)
      .where(and(eq(schema.entries.status, 'awarded'), eq(schema.entries.showcase, true), or(ilike(schema.entries.title, like), ilike(schema.entries.summary, like), ilike(schema.entries.sector, like)))).limit(5),
    db.select({ id: schema.content.id, q: schema.content.title, a: schema.content.body }).from(schema.content).where(and(eq(schema.content.kind, 'faq'), eq(schema.content.published, true), or(ilike(schema.content.title, like), ilike(schema.content.body, like)))).limit(5),
  ]);
  const hits: Hit[] = [
    ...(/^CEDA-\d{2}-\d{4}$/i.test(q) ? [{ href: `/track?ref=${encodeURIComponent(q.toUpperCase())}`, title: `Track ${q.toUpperCase()}`, text: 'See where this application is', group: 'Track' }] : []),
    ...pages,
    ...inst.filter((i) => i.def.audience !== 'staff').map((i) => ({ href: `/i/${i.slug}`, title: i.name, text: i.tagline ?? '', group: 'Competitions' })),
    ...funded.map((e) => ({ href: `/funded#${e.ref}`, title: e.title, text: e.summary.slice(0, 90), group: 'Funded innovators' })),
    ...faqs.map((f) => ({ href: `/help#faq-${f.id}`, title: f.q, text: f.a.slice(0, 90), group: 'Help' })),
  ];
  return Response.json({ hits: hits.slice(0, 14) });
}
