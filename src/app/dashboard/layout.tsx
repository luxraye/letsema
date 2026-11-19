import Link from 'next/link';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { Bell, LogOut } from 'lucide-react';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { navFor } from '@/lib/nav';
import { ROLE_LABEL } from '@/lib/rbac';
import { Sidebar } from '@/components/sidebar';
import { Live } from '@/components/live';
import { Avatar } from '@/components/ui';
import { logout } from '@/app/actions/auth';
import { RoleSwitcher } from '@/components/role-switcher';
import { demoMode } from '@/lib/notify';
import { A11yMenu } from '@/components/a11y';
import { ChatWidget } from '@/components/chat-widget';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const [unread] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.notifications).where(and(eq(schema.notifications.userId, me.id), isNull(schema.notifications.readAt)));
  const badges: Record<string, number> = {};
  if (me.role === 'evaluator') { const [q] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.evaluations).where(and(eq(schema.evaluations.evaluatorId, me.id), isNull(schema.evaluations.submittedAt))); badges['/dashboard/review'] = q.n; }
  if (me.role === 'consultant' || me.role === 'admin' || me.role === 'superadmin') { const [w] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.chats).where(eq(schema.chats.status, 'waiting')); badges['/dashboard/chat'] = w.n; }
  return (
    <div className="min-h-dvh bg-sand/50">
      <Live />
      <Sidebar items={navFor(me.role)} badges={badges} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 pl-16 backdrop-blur lg:pl-6">
          <div className="min-w-0"><div className="truncate text-sm font-bold">{me.name}</div><div className="truncate text-xs text-muted">{ROLE_LABEL[me.role]}</div></div>
          <div className="ml-auto flex items-center gap-1">
            {demoMode() && <RoleSwitcher current={me.email} />}
            <A11yMenu />
            <Link href="/dashboard/notifications" className="relative grid size-9 place-items-center rounded-lg text-muted hover:bg-sand" aria-label={`Notifications, ${unread.n} unread`}>
              <Bell size={18} />{unread.n > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">{unread.n}</span>}
            </Link>
            <Link href="/dashboard/profile" aria-label="Profile" className="ml-1"><Avatar name={me.name} size={32} /></Link>
            <form action={logout}><button className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand" aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></form>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
      {me.role === 'innovator' && <ChatWidget signedIn />}
    </div>
  );
}
