import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { CheckCircle2, XCircle } from 'lucide-react';
import { db } from '@/db';
import { PageHeader, Stat } from '@/components/ui';
import { verifyChain } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Status and hosting' };

async function credits() {
  const md = await readFile(path.join(process.cwd(), 'public/photos/CREDITS.md'), 'utf8').catch(() => '');
  return [...md.matchAll(/^\| `([^`]+)` \| `[^`]+` \| \[View on Unsplash\]\(([^)]+)\)/gm)].map((m) => ({ file: m[1], url: m[2] }));
}

export default async function Status() {
  const t = performance.now();
  let dbOk = true;
  try { await db.execute(sql`select 1`); } catch { dbOk = false; }
  const dbMs = Math.round((performance.now() - t) * 10) / 10;
  const t2 = performance.now();
  const [sizes] = dbOk ? (await db.execute<{ users: number; entries: number; audit: number; size: string }>(sql`select (select count(*)::int from users) users, (select count(*)::int from entries) entries, (select count(*)::int from audit) audit, pg_size_pretty(pg_database_size(current_database())) size`)).rows : [];
  const queryMs = Math.round((performance.now() - t2) * 10) / 10;
  const chain = dbOk ? await verifyChain() : null;
  const photos = await credits();
  const up = process.uptime();
  const checks = [
    ['Web server', true, `Up for ${up > 86400 ? `${Math.floor(up / 86400)} days` : up > 3600 ? `${Math.floor(up / 3600)} hours` : `${Math.max(1, Math.floor(up / 60))} minutes`} since the last deploy`],
    ['Database', dbOk, dbOk ? `Answered in ${dbMs} ms` : 'Not reachable'],
    ['Audit trail', !!chain?.ok, chain ? (chain.ok ? `All ${chain.count} records link up` : `Broken at record ${chain.brokenAt}`) : 'Unknown'],
  ] as const;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="Trust" title="Status and hosting" sub="Measured live each time this page loads. Monitors can poll /api/health." />
      <ul className="card mb-6 divide-y divide-line">{checks.map(([name, ok, detail]) => <li key={name} className="flex items-center gap-3 p-4">{ok ? <CheckCircle2 className="text-emerald-600" /> : <XCircle className="text-rose-600" />}<b className="w-32">{name}</b><span className="text-sm text-muted">{detail}</span></li>)}</ul>
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Database round trip" value={`${dbMs} ms`} />
        <Stat label="Counting query" value={`${queryMs} ms`} hint="Four tables at once" />
        <Stat label="Records held" value={sizes ? sizes.users + sizes.entries + sizes.audit : '–'} hint={sizes ? `${sizes.users} people, ${sizes.entries} applications` : undefined} />
        <Stat label="Database size" value={sizes?.size ?? '–'} />
      </div>

      <h2 className="mb-3 text-2xl font-bold">How it is built and hosted</h2>
      <div className="mb-10 grid gap-4 md:grid-cols-2 text-sm">
        <div className="card p-5"><h3 className="mb-2 font-bold">Built to be boring to run</h3><ul className="list-disc space-y-1 pl-5 text-muted"><li>One Next.js web app (Node.js) and one PostgreSQL database. No other moving parts.</li><li>Pages are rendered on the server, so phones on slow networks get small pages.</li><li>The app holds no state of its own, so more copies can run side by side behind a load balancer as use grows.</li><li>Runs on any cloud, or on servers in Botswana, from one container image.</li></ul></div>
        <div className="card p-5"><h3 className="mb-2 font-bold">Security</h3><ul className="list-disc space-y-1 pl-5 text-muted"><li>Passwords hashed with bcrypt; accounts lock for 15 minutes after five wrong tries.</li><li>Sessions are random tokens stored only as fingerprints; signing out anywhere ends them everywhere.</li><li>Every page sends strict security headers; uploads are checked by their real file type, not their name.</li><li>Each role sees only what it needs. Evaluators never see an applicant&apos;s name.</li></ul></div>
      </div>

      <h2 className="mb-3 text-2xl font-bold">Photo credits</h2>
      <p className="mb-3 text-sm text-muted">Photos are from Unsplash under the Unsplash licence. Thank you to the photographers.</p>
      <ul className="grid gap-1 text-sm sm:grid-cols-2">{photos.map((p) => <li key={p.file}><a className="underline" href={p.url} target="_blank" rel="noopener noreferrer">{p.file}</a></li>)}</ul>
    </div>
  );
}
