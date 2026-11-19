import { Fragment, useState } from 'react';
import { Plus, Search, Check } from 'lucide-react';
import { useMe, useStore, PageHeader, Tabs, Button, Field, Modal, attempt, Badge, Avatar } from '../../ui/kit';
import { PERMISSIONS } from '../../core/rbac';
import { saveRole, setUserDisabled, setUserRole, togglePermission } from '../../core/actions';
import type { RoleDef } from '../../core/types';

export default function AdminUsers() {
  const me = useMe()!;
  const s = useStore();
  const [tab, setTab] = useState<'users' | 'roles'>('roles');
  const [q, setQ] = useState('');
  const [newRole, setNewRole] = useState<RoleDef | null>(null);
  const users = s.users.filter((u) => !q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(PERMISSIONS.map((p) => p.group))];
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Users & roles" sub="Each role is a set of permissions. Change the matrix and access changes everywhere at once; add a new role without any code." />
      <Tabs value={tab} onChange={setTab} items={[{ key: 'roles', label: 'Permission matrix' }, { key: 'users', label: `Users (${s.users.length})` }]} />
      <div className="mt-5">
        {tab === 'roles' && (<>
          <Button className="mb-3" variant="secondary" onClick={() => setNewRole({ key: '', label: '', description: '', permissions: ['reports.view'], builtIn: false, internal: false })}><Plus size={15} /> Add a role</Button>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-line"><th className="sticky left-0 bg-card p-3 text-left">Permission</th>{s.settings.roles.map((r) => <th key={r.key} className="p-3 text-center"><div>{r.label}</div><div className="text-[10px] font-normal text-muted">{r.internal ? 'internal' : 'external'}{r.builtIn ? '' : ' · custom'}</div></th>)}</tr></thead>
              <tbody>
                {groups.map((g) => (<Fragment key={g}>
                  <tr className="bg-paper"><td colSpan={s.settings.roles.length + 1} className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted">{g}</td></tr>
                  {PERMISSIONS.filter((p) => p.group === g).map((p) => (
                    <tr key={p.key} className="border-t border-line/60">
                      <td className="sticky left-0 bg-card p-3">{p.label}</td>
                      {s.settings.roles.map((r) => {
                        const on = r.permissions.includes(p.key);
                        return <td key={r.key} className="p-2 text-center"><button onClick={() => attempt(() => togglePermission(me, r.key, p.key), `${r.label}: ${on ? 'removed' : 'granted'} “${p.label}”`)} aria-pressed={on} aria-label={`${r.label}: ${p.label}`} className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${on ? 'border-brand bg-brand text-brand-ink' : 'border-line hover:border-ink/40'}`}>{on && <Check size={14} />}</button></td>;
                      })}
                    </tr>
                  ))}
                </Fragment>))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Reviewers deliberately lack “See who submitted” so scoring stays blind. Observers have no write permissions. Every change here is written to the audit trail.</p>
        </>)}
        {tab === 'users' && (<>
          <div className="relative mb-3 max-w-md"><Search size={16} className="absolute left-3 top-3 text-muted" /><input className="field pl-9" placeholder="Search name, email or role" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" /></div>
          <div className="card divide-y divide-line">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <Avatar name={u.name} size={30} />
                <div className="min-w-0 flex-1"><div className="font-semibold">{u.name} {u.staff && <Badge tone="accent">staff</Badge>} {!u.verified && <Badge tone="amber">unverified</Badge>} {u.disabled && <Badge tone="rose">disabled</Badge>}</div><div className="truncate text-xs text-muted">{u.email}</div></div>
                <select className="field w-auto py-1.5 text-sm" value={u.role} disabled={u.id === me.id} onChange={(e) => attempt(() => setUserRole(me, u.id, e.target.value), 'Role changed')} aria-label={`Role for ${u.name}`}>{s.settings.roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
                {u.id !== me.id && <Button size="sm" variant="ghost" onClick={() => attempt(() => setUserDisabled(me, u.id, !u.disabled), u.disabled ? 'Enabled' : 'Disabled')}>{u.disabled ? 'Enable' : 'Disable'}</Button>}
              </div>
            ))}
          </div>
        </>)}
      </div>
      <Modal open={!!newRole} onClose={() => setNewRole(null)} title="New role">
        {newRole && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (attempt(() => saveRole(me, newRole), 'Role created. Set its permissions in the matrix.') !== undefined) setNewRole(null); }}>
          <Field label="Name" htmlFor="rl"><input id="rl" className="field" placeholder="e.g. Industry mentor" value={newRole.label} onChange={(e) => setNewRole({ ...newRole, label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') })} /></Field>
          <Field label="Description" htmlFor="rd"><input id="rd" className="field" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[var(--brand)]" checked={newRole.internal} onChange={(e) => setNewRole({ ...newRole, internal: e.target.checked })} /> CEDA-internal role</label>
          <Button type="submit" disabled={!newRole.label.trim()}>Create role</Button>
        </form>}
      </Modal>
    </div>
  );
}
