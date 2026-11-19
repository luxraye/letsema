import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { Avatar, Badge } from '@/components/ui';
import { Submit } from '@/components/forms';
import { currentUser } from '@/lib/session';
import { ROLE_LABEL } from '@/lib/rbac';
import { ago } from '@/lib/format';
import { replyThread } from '@/app/actions/community';

export const dynamic = 'force-dynamic';

export default async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db.select({ t: schema.threads, author: schema.users.name, role: schema.users.role }).from(schema.threads).innerJoin(schema.users, eq(schema.users.id, schema.threads.authorId)).where(eq(schema.threads.id, id));
  if (!row) notFound();
  const replies = await db.select({ r: schema.replies, author: schema.users.name, role: schema.users.role }).from(schema.replies).innerJoin(schema.users, eq(schema.users.id, schema.replies.authorId)).where(eq(schema.replies.threadId, id)).orderBy(asc(schema.replies.createdAt));
  const me = await currentUser();
  const Post = ({ name, role, at, body }: { name: string; role: string; at: Date; body: string }) => (
    <div className="flex gap-3"><Avatar name={name} size={36} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-sm"><b>{name}</b>{role !== 'innovator' && <Badge tone="brand">{ROLE_LABEL[role as keyof typeof ROLE_LABEL] ?? role}</Badge>}<span className="text-xs text-muted">{ago(at)}</span></div><p className="mt-1 whitespace-pre-line text-sm">{body}</p></div></div>
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/community" className="text-sm text-muted hover:underline">← Community</Link>
      <div className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--brand)]">{row.t.category}</div>
      <h1 className="mb-5 text-3xl font-extrabold">{row.t.title}</h1>
      <div className="card p-5"><Post name={row.author} role={row.role} at={row.t.createdAt} body={row.t.body} /></div>
      <h2 className="mb-3 mt-8 font-bold">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</h2>
      <div className="card divide-y divide-line">{replies.map(({ r, author, role }) => <div key={r.id} className="p-5"><Post name={author} role={role} at={r.createdAt} body={r.body} /></div>)}</div>
      {me ? (
        <form action={replyThread.bind(null, id)} className="card mt-5 space-y-3 p-5"><label className="block"><span className="label">Your reply</span><textarea name="body" required maxLength={5000} rows={3} className="field" /></label><Submit className="btn-primary">Post reply</Submit></form>
      ) : <p className="mt-5 text-sm"><Link className="font-semibold text-[var(--brand)]" href={`/login?next=/community/${id}`}>Sign in</Link> to reply.</p>}
    </div>
  );
}
