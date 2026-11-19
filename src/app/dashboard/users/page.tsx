import { asc, eq } from 'drizzle-orm';
import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { db, schema } from '@/db';
import { ROLES } from '@/db/schema';
import { requireUser } from '@/lib/session';
import { PageHeader, Tabs, Avatar, Badge } from '@/components/ui';
import { GRANTS, PERMISSIONS, ROLE_LABEL, type Permission } from '@/lib/rbac';
import { setRole, unlockUser } from '@/app/actions/admin';
import { InviteForm } from './invite';
import { ago } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Users({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const me = await requireUser({ perm: 'users.manage' });
  const sp = await searchParams; const tab = sp.tab === 'matrix' ? 'matrix' : 'people';
  const users = await db.select({ u: schema.users, space: schema.spaces.short }).from(schema.users).leftJoin(schema.spaces, eq(schema.spaces.id, schema.users.spaceId)).orderBy(asc(schema.users.role), asc(schema.users.name));
  const spaces = await db.select().from(schema.spaces);
  const list = users.filter(({ u }) => !sp.q || `${u.name} ${u.email}`.toLowerCase().includes(sp.q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Users and roles" sub="Each person has one role. What a role can do is listed in the permission matrix; every page and action checks it on the server." />
      <Tabs active={tab} items={[{ key: 'people', label: `People (${users.length})`, href: '/dashboard/users' }, { key: 'matrix', label: 'Permission matrix', href: '/dashboard/users?tab=matrix' }]} />
      {tab === 'matrix' ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-sand/60 text-xs"><tr><th className="p-3 text-left">Permission</th>{ROLES.map((r) => <th key={r} className="p-2 text-center font-semibold">{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{(Object.keys(PERMISSIONS) as Permission[]).map((p) => <Fragment key={p}><tr><td className="p-3">{PERMISSIONS[p]}<div className="mono text-[11px] text-muted">{p}</div></td>{ROLES.map((r) => <td key={r} className="text-center">{GRANTS[r].includes(p) ? <Check size={16} className="mx-auto text-emerald-600" aria-label="yes" /> : <span className="text-line">–</span>}</td>)}</tr></Fragment>)}</tbody>
          </table>
          <p className="p-3 text-xs text-muted">Separation of duties: administrators run the programme but cannot score or vote; evaluators see applications blind; observers can read but not change anything.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div>
            <form className="mb-3"><input name="q" defaultValue={sp.q} className="field" placeholder="Search name or email" /></form>
            <div className="card divide-y divide-line">
              {list.slice(0, 80).map(({ u, space }) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
                  <Avatar name={u.name} size={32} />
                  <div className="min-w-0 flex-1"><div className="font-semibold">{u.name} {u.lockedUntil && u.lockedUntil > new Date() && <Badge tone="red">locked</Badge>}{space && <Badge tone="blue">{space}</Badge>}</div><div className="truncate text-xs text-muted">{u.email} · joined {ago(u.createdAt)}</div></div>
                  {u.lockedUntil && u.lockedUntil > new Date() && <form action={unlockUser.bind(null, u.id)}><button className="btn-ghost !py-1.5 text-xs">Unlock</button></form>}
                  {u.id === me.id ? <Badge>{ROLE_LABEL[u.role]} (you)</Badge> : (
                    <form action={setRole.bind(null, u.id)} className="flex gap-1">
                      <select name="role" defaultValue={u.role} className="field !w-44 !py-1.5 text-xs" aria-label={`Role for ${u.name}`}>{ROLES.filter((r) => r !== 'superadmin' || me.role === 'superadmin').map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                      <select name="spaceId" defaultValue={u.spaceId ?? ''} className="field !w-24 !py-1.5 text-xs" aria-label="Space"><option value="">–</option>{spaces.map((s) => <option key={s.id} value={s.id}>{s.short}</option>)}</select>
                      <button className="btn-ghost !py-1.5 text-xs">Save</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
          <InviteForm superadmin={me.role === 'superadmin'} />
        </div>
      )}
    </div>
  );
}
