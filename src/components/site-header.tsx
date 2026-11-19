import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { MENUS } from '@/lib/site-map';
import { SiteSearch } from './site-search';
import { Logo } from './logo';
import { A11yMenu } from './a11y';
import { LangToggle } from './lang-toggle';
import { currentUser } from '@/lib/session';
import { t, getLang } from '@/lib/i18n';
import { MobileNav } from './mobile-nav';

export async function SiteHeader() {
  const me = await currentUser();
  const tr = await t();
  const lang = await getLang();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white backdrop-blur">
      <div className="border-b border-white/10 bg-black/20 text-[11px] text-white/70">
        <div className="mx-auto flex h-7 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <span className="truncate">Citizen Entrepreneurial Development Agency · Republic of Botswana</span>
          <div className="flex shrink-0 items-center gap-3">
            <LangToggle lang={lang} />
            <span className="hidden text-white/20 sm:inline">|</span>
            <Link href="/help" className="hidden text-sand hover:text-white md:inline">Live chat Mon–Fri 09:00–16:00</Link>
            <span className="hidden text-white/20 sm:inline">|</span>
            <Link href="/dial" className="hidden text-sand hover:text-white sm:inline">No data? Dial *161#</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="CEDA Innovation Portal home"><Logo dark /></Link>
        <nav className="hidden items-center gap-2 lg:flex" aria-label="Main">
          {MENUS.map((m) => (
            <div key={m.label} className="group relative">
              <button className="flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/85 transition hover:bg-white/10 hover:text-white group-focus-within:bg-white/10"><m.icon size={14} />{tr(m.label)}<ChevronDown size={13} className="opacity-60 transition group-hover:rotate-180" /></button>
              <div className="invisible absolute left-0 top-full z-50 w-80 translate-y-1 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-2xl border border-white/10 bg-white p-2.5 text-ink shadow-2xl">
                  {m.items.map((i) => (
                    <Link key={i.href} href={i.href} className="group/item flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-sand/60">
                      <span className="mt-0.5 rounded-lg bg-sand p-2 text-copper transition group-hover/item:bg-[var(--brand)] group-hover/item:text-white"><i.icon size={15} /></span>
                      <span><span className="block text-xs font-bold group-hover/item:text-copper">{i.title}</span><span className="block text-[11px] leading-snug text-muted">{i.text}</span></span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SiteSearch />
          <Link href="/judges" className="hidden items-center gap-2 rounded-full border border-amber/40 bg-gradient-to-r from-amber/20 to-[var(--brand)]/20 px-3.5 py-1.5 text-xs font-bold text-amber-200 shadow-sm transition hover:bg-amber/30 hover:text-white sm:flex">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-amber opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-amber" /></span>
            {tr('5-Min Judges’ Tour')}
          </Link>
          <A11yMenu dark />
          {me ? <Link href="/dashboard" className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-bold text-white shadow transition hover:bg-copper">{tr('Dashboard')}</Link> : <Link href="/login" className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-bold text-white shadow transition hover:bg-copper">{tr('Sign in')}</Link>}
          <MobileNav menus={MENUS.map((m) => ({ label: tr(m.label), items: m.items.map(({ href, title }) => ({ href, title })) }))} />
        </div>
      </div>
    </header>
  );
}
