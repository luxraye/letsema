'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/rbac';

import { FORUM_CATEGORIES as CATEGORIES } from '@/lib/catalogue';

export async function createThread(_: unknown, fd: FormData): Promise<{ error?: string } | undefined> {
  const me = await requireUser();
  const title = String(fd.get('title') ?? '').trim(); const body = String(fd.get('body') ?? '').trim();
  const category = String(fd.get('category') ?? 'General');
  if (title.length < 8) return { error: 'Give your question a title of at least 8 characters.' };
  if (body.length < 10) return { error: 'Add a little more detail.' };
  const [t] = await db.insert(schema.threads).values({ title: title.slice(0, 140), body: body.slice(0, 5000), category: CATEGORIES.includes(category) ? category : 'General', authorId: me.id }).returning();
  redirect(`/community/${t.id}`);
}

export async function replyThread(threadId: string, fd: FormData) {
  const me = await requireUser();
  const body = String(fd.get('body') ?? '').trim().slice(0, 5000);
  if (!body) return;
  const [t] = await db.select({ id: schema.threads.id }).from(schema.threads).where(eq(schema.threads.id, threadId));
  if (!t) return;
  await db.insert(schema.replies).values({ threadId, authorId: me.id, body });
  revalidatePath(`/community/${threadId}`);
}

export async function pinThread(threadId: string, pinned: boolean) {
  const me = await requireUser();
  if (!can(me.role, 'content.manage')) return;
  await db.update(schema.threads).set({ pinned }).where(eq(schema.threads.id, threadId));
  revalidatePath('/community');
}
