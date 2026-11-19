import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui';
import { NewInstanceForm } from './form';

export default async function NewInstance() {
  const me = await requireUser({ perm: 'instance.manage' });
  const spaces = await db.select({ id: schema.spaces.id, name: schema.spaces.name }).from(schema.spaces);
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Instance" sub="Start from a template. You can change everything before you publish." />
      <NewInstanceForm spaces={me.role === 'partner_admin' ? spaces.filter((s) => s.id === me.spaceId) : spaces} />
    </div>
  );
}
