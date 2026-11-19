'use client';
import { useActionState } from 'react';
import { inviteUser, type AState } from '@/app/actions/admin';
import { FormMessage, Submit } from '@/components/forms';
import { ROLES } from '@/db/schema';
import { ROLE_LABEL } from '@/lib/rbac';

export function InviteForm({ superadmin }: { superadmin: boolean }) {
  const [s, action] = useActionState<AState, FormData>(inviteUser, undefined);
  return (
    <form action={action} className="card space-y-3 p-5 lg:self-start">
      <div className="font-bold">Add a person</div>
      <input name="name" className="field" placeholder="Full name" required />
      <input name="email" type="email" className="field" placeholder="Email" required />
      <input name="title" className="field" placeholder="Job title (optional)" />
      <select name="role" className="field" defaultValue="evaluator">{ROLES.filter((r) => r !== 'superadmin' || superadmin).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
      <FormMessage state={s} />
      <Submit className="btn-primary w-full">Invite</Submit>
    </form>
  );
}
