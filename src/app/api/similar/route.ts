import { NextResponse } from 'next/server';
import { ne } from 'drizzle-orm';
import { db, schema } from '@/db';

const STOP = new Set('the a an and or of for to in on with by is are be our we it this that from at as your you can will low cost'.split(' '));
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/** TF-IDF cosine similarity over submitted titles and summaries. Only titles are returned; never who submitted them. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  const rows = await db.select({ title: schema.entries.title, summary: schema.entries.summary }).from(schema.entries).where(ne(schema.entries.status, 'draft'));
  const docs = rows.map((r) => ({ title: r.title, t: tokens(`${r.title} ${r.summary}`) }));
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set(d.t)) df.set(w, (df.get(w) ?? 0) + 1);
  const vec = (t: string[]) => { const v = new Map<string, number>(); for (const w of t) v.set(w, (v.get(w) ?? 0) + 1); for (const [w, c] of v) v.set(w, c * Math.log((docs.length + 1) / ((df.get(w) ?? 0) + 1))); return v; };
  const cos = (a: Map<string, number>, b: Map<string, number>) => { let dot = 0, na = 0, nb = 0; for (const [, x] of a) na += x * x; for (const [, y] of b) nb += y * y; for (const [w, x] of a) dot += x * (b.get(w) ?? 0); return na && nb ? dot / Math.sqrt(na * nb) : 0; };
  const qv = vec(tokens(q));
  const hits = docs.map((d) => ({ title: d.title, score: cos(qv, vec(d.t)) })).filter((h) => h.score > 0.3).sort((a, b) => b.score - a.score).slice(0, 3);
  return NextResponse.json({ hits });
}
