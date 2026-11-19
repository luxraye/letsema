'use client';
import { useActionState } from 'react';
import { saveContent, type AState } from '@/app/actions/admin';
import { FormMessage, Submit } from '@/components/forms';

type Item = { id: string; title: string; body: string; category: string; slug: string; url: string; published: boolean; sort: number };
export function ContentForm({ kind, item }: { kind: string; item?: Item }) {
  const [s, action] = useActionState<AState, FormData>(saveContent, undefined);
  return (
    <form action={action} className="card space-y-3 p-5 lg:sticky lg:top-20 lg:self-start">
      <div className="font-bold">{item ? 'Edit' : 'Add'} {kind}</div>
      <input type="hidden" name="kind" value={kind} />{item && <input type="hidden" name="id" value={item.id} />}
      <input name="title" className="field" placeholder={kind === 'faq' ? 'Question' : 'Title'} defaultValue={item?.title} required />
      <textarea name="body" className="field min-h-36" placeholder={kind === 'faq' ? 'Answer' : 'Text'} defaultValue={item?.body} />
      <input name="category" className="field" placeholder="Category (e.g. Applying)" defaultValue={item?.category} />
      {kind === 'page' && <input name="slug" className="field" placeholder="Web address, e.g. about" defaultValue={item?.slug} />}
      {kind === 'document' && <input name="url" className="field" placeholder="Link to the file" defaultValue={item?.url} />}
      <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={item?.published ?? true} /> Visible</label><label className="flex items-center gap-2">Order <input name="sort" className="field !w-20 !py-1" defaultValue={item?.sort ?? 0} /></label></div>
      <FormMessage state={s} />
      <Submit className="btn-primary w-full">{item ? 'Save changes' : 'Add'}</Submit>
    </form>
  );
}
