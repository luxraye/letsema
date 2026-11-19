'use client';
import { useActionState } from 'react';
import { followEntry, type PState } from '@/app/actions/public';
import { FormMessage, Submit } from '@/components/forms';
export function FollowForm({ refCode }: { refCode: string }) {
  const [s, action] = useActionState<PState, FormData>(followEntry, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="ref" value={refCode} /><input name="contact" className="field" placeholder="Email or mobile, e.g. 71 234 567" required aria-label="Email or mobile" /><FormMessage state={s} /><Submit className="btn-primary w-full">Alert me</Submit></form>;
}
