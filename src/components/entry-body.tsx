import { asc, desc, eq } from 'drizzle-orm';
import { FileDown } from 'lucide-react';
import { db, schema } from '@/db';
import type { InstanceDefinition } from '@/db/schema';
import { wordDiff } from '@/lib/diff';

/** The application as a reader sees it. blind=true hides who submitted it (for evaluators). */
export async function EntryBody({ entry, def, blind }: { entry: typeof schema.entries.$inferSelect; def: InstanceDefinition; blind: boolean }) {
  const [files, versions] = await Promise.all([
    db.select({ id: schema.entryFiles.id, field: schema.entryFiles.field, name: schema.entryFiles.name, size: schema.entryFiles.size, pages: schema.entryFiles.pages, sha256: schema.entryFiles.sha256 }).from(schema.entryFiles).where(eq(schema.entryFiles.entryId, entry.id)),
    db.select().from(schema.entryVersions).where(eq(schema.entryVersions.entryId, entry.id)).orderBy(desc(schema.entryVersions.version)).limit(2),
  ]);
  const [latest, prev] = versions;
  const scrub = (s: string) => blind ? entry.team.reduce((t, m) => m.name ? t.replaceAll(m.name, '[applicant]') : t, s) : s;
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h2 className="text-xl font-bold">{scrub(entry.title)}</h2>
        {entry.summary && <p className="mt-1 text-muted">{scrub(entry.summary)}</p>}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">{entry.sector && <span className="chip bg-sand">{entry.sector}</span>}{entry.district && <span className="chip bg-sand">{entry.district}</span>}<span className="chip bg-sand">Version {entry.version}</span>{!blind && <span className="chip bg-sand">Team of {entry.team.length}</span>}</div>
        {blind && <p className="mt-3 text-xs text-muted">Blind review: names, emails and team details are hidden from you.</p>}
      </div>
      {latest && prev && (
        <div className="card border-amber-200 p-5">
          <h3 className="font-bold">Changed since version {prev.version}</h3>
          {Object.keys({ ...prev.answers, ...latest.answers }).filter((k) => (prev.answers[k] ?? '') !== (latest.answers[k] ?? '')).map((k) => (
            <div key={k} className="mt-3"><div className="text-sm font-semibold">{def.form.find((f) => f.key === k)?.label ?? k}</div><p className="mt-1 text-sm leading-relaxed">{wordDiff(scrub(prev.answers[k] ?? ''), scrub(latest.answers[k] ?? '')).map((p, n) => <span key={n} className={p.t === 'add' ? 'rounded bg-emerald-100' : p.t === 'del' ? 'rounded bg-rose-100 line-through' : ''}>{p.s}</span>)}</p></div>
          ))}
        </div>
      )}
      <div className="card divide-y divide-line">
        {def.form.map((f) => {
          const file = files.find((x) => x.field === f.key);
          return (
            <div key={f.key} className="p-5">
              <div className="text-sm font-semibold">{f.label}</div>
              {f.type === 'file' ? (file ? <a href={`/api/files/${file.id}`} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-sand"><FileDown size={16} /> {blind ? `${f.label}.pdf` : file.name} <span className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB{file.pages ? `, ${file.pages} pages` : ''}</span></a> : <p className="text-sm text-muted">Not uploaded</p>)
                : <p className="mt-1 whitespace-pre-line text-sm text-muted">{scrub(entry.answers[f.key] ?? '') || '–'}</p>}
            </div>
          );
        })}
      </div>
      {!blind && (
        <div className="card p-5"><h3 className="mb-2 font-bold">Team</h3><ul className="space-y-1 text-sm">{entry.team.map((m, n) => <li key={n}>{m.name}{m.lead && <b> (lead)</b>} · {m.role ?? '–'} · {m.share ?? 0}% · <span className="text-muted">{m.email}</span></li>)}</ul></div>
      )}
    </div>
  );
}

export async function Thread({ entryId, showInternal }: { entryId: string; showInternal: boolean }) {
  const rows = await db.select({ m: schema.messages, author: schema.users.name, role: schema.users.role }).from(schema.messages).innerJoin(schema.users, eq(schema.users.id, schema.messages.authorId)).where(eq(schema.messages.entryId, entryId)).orderBy(asc(schema.messages.createdAt));
  const vis = rows.filter((r) => showInternal || !r.m.internal);
  if (!vis.length) return <p className="text-sm text-muted">No messages yet.</p>;
  return <ul className="space-y-2">{vis.map(({ m, author, role }) => <li key={m.id} className={`rounded-xl p-3 text-sm ${m.internal ? 'border border-dashed border-amber-300 bg-amber-50' : m.kind === 'revision_request' ? 'bg-orange-50' : 'bg-sand/60'}`}><div className="text-xs text-muted"><b className="text-ink">{author}</b> · {role === 'innovator' ? 'applicant' : 'CEDA'}{m.internal && ' · internal note'}{m.kind === 'revision_request' && ' · changes requested'}</div>{m.body}</li>)}</ul>;
}

/** Tracking: every recorded action on this application, straight from the hash-chained audit log. */
export async function EntryAudit({ entryId }: { entryId: string }) {
  const rows = await db.select().from(schema.audit).where(eq(schema.audit.entryId, entryId)).orderBy(asc(schema.audit.seq));
  return (
    <ol className="space-y-2 border-l-2 border-line pl-4 text-sm">
      {rows.map((r) => <li key={r.seq}><div className="font-semibold">{r.action.replace(/^\w+\./, '').replace(/_/g, ' ')}</div><div className="text-xs text-muted">{r.actorName} · {r.at.toLocaleString('en-GB', { timeZone: 'Africa/Gaborone', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · <span className="mono">#{r.seq} {r.hash.slice(0, 8)}</span></div></li>)}
      {!rows.length && <li className="text-muted">Nothing recorded yet.</li>}
    </ol>
  );
}
