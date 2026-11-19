import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { currentUser } from '@/lib/session';
import { FORUM_CATEGORIES } from '@/lib/catalogue';
import { NewThread } from './form';

export const metadata = { title: 'Ask the community' };

export default async function New() {
  if (!(await currentUser())) redirect('/login?next=/community/new');
  return <div className="mx-auto max-w-2xl px-4 py-12"><PageHeader eyebrow="Community" title="Ask a question" /><NewThread categories={FORUM_CATEGORIES} /></div>;
}
