import Link from 'next/link';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { Bell } from 'lucide-react';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { navFor } from '@/lib/nav';
import { ROLE_LABEL } from '@/lib/rbac';
import { Sidebar } from '@/components/sidebar';
import { Live } from '@/components/live';
import { Avatar } from '@/components/ui';
import { RoleSwitcher } from '@/components/role-switcher';
import { demoMode } from '@/lib/notify';
import { A11yMenu } from '@/components/a11y';
import { ChatWidget } from '@/components/chat-widget';
import { ThemeToggle } from '@/components/theme';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const [unread] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.notifications).where(and(eq(schema.notifications.userId, me.id), isNull(schema.notifications.readAt)));
  const badges: Record<string, number> = {};
  if (me.role === 'evaluator') { const [q] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.evaluations).where(and(eq(schema.evaluations.evaluatorId, me.id), isNull(schema.evaluations.submittedAt))); badges['/dashboard/review'] = q.n; }
  if (me.role === 'consultant' || me.role === 'admin' || me.role === 'superadmin') { const [w] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.chats).where(eq(schema.chats.status, 'waiting')); badges['/dashboard/chat'] = w.n; }
  const look = (await cookies()).get('look')?.value === 'azure' ? 'azure' : 'burgundy';
  return (
    <div className="relative isolate min-h-dvh bg-bg">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_85%_-10%,var(--t-aura-2),transparent_60%),radial-gradient(50rem_30rem_at_10%_110%,var(--t-aura-3),transparent_60%)]" />
      <Live />
      <Sidebar items={navFor(me.role)} badges={badges} user={{ name: me.name, email: me.email, role: ROLE_LABEL[me.role] }} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/70 px-4 pl-16 backdrop-blur-xl lg:pl-8">
          <div className="min-w-0 truncate text-[15px] text-muted">{ROLE_LABEL[me.role]}</div>
          <div className="ml-auto flex items-center gap-1">
            {demoMode() && <RoleSwitcher current={me.email} />}
            <ThemeToggle initial={look} dark={false} />
            <A11yMenu />
            <Link href="/dashboard/notifications" className="relative grid size-9 place-items-center rounded-lg text-muted hover:bg-sand" aria-label={`Notifications, ${unread.n} unread`}>
              <Bell size={18} />{unread.n > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">{unread.n}</span>}
            </Link>
            <Link href="/dashboard/profile" aria-label="Profile" className="ml-1"><Avatar name={me.name} size={32} /></Link>
          </div>
        </header>
        <main id="main" className="px-4 py-8 sm:px-6 lg:px-8 [&_h1]:!text-[1.75rem]">{children}</main>
      </div>
      {me.role === 'innovator' && <ChatWidget signedIn />}
    </div>
  );
}
