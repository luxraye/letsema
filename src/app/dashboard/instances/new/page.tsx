import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui';
import { NewInstanceForm } from './form';
import { standardDefinition } from '@/lib/catalogue';
import { toCode } from '@/lib/definition-code';

export default async function NewInstance() {
  const me = await requireUser({ perm: 'instance.manage' });
  const spaces = await db.select({ id: schema.spaces.id, name: schema.spaces.name }).from(schema.spaces);
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Instance" sub="Start from a template, or paste a JSON document if you are in IT. You can change everything before you publish." />
      <NewInstanceForm sample={toCode({ name: 'Green Economy Fund 2027', tagline: 'Funding for citizen-owned green businesses', description: 'An open call for ventures that cut waste, water or energy use.', photo: '/photos/okavango-aerial.webp', definition: standardDefinition() })} spaces={me.role === 'partner_admin' ? spaces.filter((s) => s.id === me.spaceId) : spaces} />
    </div>
  );
}
