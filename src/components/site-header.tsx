import Link from 'next/link';
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { Avatar } from './ui';
import { logout } from '@/app/actions/auth';
import { ROLE_LABEL } from '@/lib/rbac';
import { MENUS } from '@/lib/site-map';
import { SiteSearch } from './site-search';
import { Logo } from './logo';
import { A11yMenu } from './a11y';
import { LangToggle } from './lang-toggle';
import { currentUser } from '@/lib/session';
import { t, getLang } from '@/lib/i18n';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme';
import { cookies } from 'next/headers';

export async function SiteHeader() {
  const me = await currentUser();
  const tr = await t();
  const lang = await getLang();
  const look = (await cookies()).get('look')?.value === 'azure' ? 'azure' : 'burgundy';
  return (
    <>
      <div className="relative z-40 bg-ink text-[11px] text-white/70">
        <div className="mx-auto flex h-7 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {me ? (
            <span className="flex min-w-0 items-center gap-2" data-signed-in>
              <span className="truncate">Signed in as <b className="text-white">{me.name}</b><span className="hidden sm:inline"> · {ROLE_LABEL[me.role]}</span></span>
              <Link href="/dashboard" className="shrink-0 font-semibold text-amber hover:text-white">Back to my dashboard</Link>
              <form action={logout} className="hidden sm:block"><button className="inline-flex items-center gap-1 hover:text-white"><LogOut size={11} /> Sign out</button></form>
            </span>
          ) : <span className="truncate">Citizen Entrepreneurial Development Agency · Republic of Botswana</span>}
          <div className="flex shrink-0 items-center gap-3">
            <LangToggle lang={lang} />
            <span className="hidden text-white/20 sm:inline">|</span>
            <Link href="/help" className="hidden hover:text-white md:inline">Live chat Mon–Fri 09:00–16:00</Link>
            <span className="hidden text-white/20 sm:inline">|</span>
            <Link href="/dial" className="hidden hover:text-white sm:inline">No data? Dial *161#</Link>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 h-0 px-2 sm:px-4 [&>div]:translate-y-2">
        <div className="glass-dark mx-auto flex h-14 max-w-7xl items-center gap-5 rounded-2xl !bg-ink/70 px-3 text-white sm:px-4">
          <Link href="/" aria-label="CEDA Innovation Portal home" className="shrink-0 transition hover:scale-[1.03]"><Logo dark /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {MENUS.map((m) => (
              <div key={m.label} className="group relative">
                <button className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white group-focus-within:bg-white/10">{tr(m.label)}<ChevronDown size={13} className="opacity-60 transition duration-300 group-hover:rotate-180" /></button>
                <div className="invisible absolute left-0 top-full z-50 w-80 translate-y-2 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="glass rounded-2xl !bg-surface/90 p-2 text-fg">
                    {m.items.map((i) => (
                      <Link key={i.href} href={i.href} data-spot className="group/item flex items-start gap-3 overflow-hidden rounded-xl p-2.5 transition hover:bg-sand">
                        <span className="mt-0.5 rounded-lg bg-sand p-2 text-copper transition duration-300 group-hover/item:scale-110 group-hover/item:bg-[var(--brand)] group-hover/item:text-white"><i.icon size={15} /></span>
                        <span><span className="block text-[13px] font-bold group-hover/item:text-copper">{i.title}</span><span className="block text-[12px] leading-snug text-muted">{i.text}</span></span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <SiteSearch />
            <Link href="/judges" className="btn-gold hidden !rounded-full !px-3.5 !py-1.5 !text-xs sm:inline-flex">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7c1238] opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-[#7c1238]" /></span>
              {tr('5-Min Judges’ Tour')}
            </Link>
            <ThemeToggle initial={look} />
            <A11yMenu dark />
            {me ? <Link href="/dashboard" aria-label={`My dashboard, signed in as ${me.name}`} className="btn-primary !rounded-full !py-1 !pl-1 !pr-3.5 !text-xs"><Avatar name={me.name} size={24} /><LayoutDashboard size={13} className="hidden sm:block" />{tr('My dashboard')}</Link> : <Link href="/login" className="btn-primary !rounded-full !px-4 !py-1.5 !text-xs">{tr('Sign in')}</Link>}
            <MobileNav menus={MENUS.map((m) => ({ label: tr(m.label), items: m.items.map(({ href, title }) => ({ href, title })) }))} />
          </div>
        </div>
      </header>
    </>
  );
}
