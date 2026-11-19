import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Accessibility, Bell, BarChart3, ClipboardCheck, FileText, Home, Inbox, KanbanSquare, LayoutDashboard, Lightbulb, LogOut, Menu, MessagesSquare,
  Settings, Shield, ShieldCheck, Sprout, Users, X, ScrollText, Megaphone, UserCircle2, RotateCcw, Radio, ChevronDown,
} from 'lucide-react';
import { useMe, useStore, toast, Avatar, Toaster } from './kit';
import { store } from '../core/store';
import { can, roleDef } from '../core/rbac';
import { demoLogin, logout, resetDemo } from '../core/actions';
import { applyPrefs, loadPrefs, type Prefs } from './prefs';
import { t } from './i18n';
import { ChatWidget } from './chat-widget';
import type { Permission } from '../core/types';
import { ago } from '../core/util';

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--brand)" />
        <path d="M7 22c4-1 6-6 9-12 3 6 5 11 9 12" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="9" r="2" fill="var(--accent)" />
      </svg>
      <span className={`font-display text-lg font-extrabold tracking-tight ${light ? 'text-white' : ''}`}>Letsema</span>
    </span>
  );
}

/** Applies the admin-chosen theme (CEDA sets colours and fonts; General criterion). */
export function ThemeApplier() {
  const s = useStore();
  useEffect(() => {
    const th = s.settings.theme;
    const r = document.documentElement.style;
    r.setProperty('--brand', th.primary);
    r.setProperty('--accent', th.accent);
    r.setProperty('--radius', String(th.radius));
    r.setProperty('--font-head', `'${th.font}'`);
    if (document.documentElement.dataset.dark !== 'true' && document.documentElement.dataset.contrast !== 'high') {
      r.setProperty('--ink', th.ink);
      r.setProperty('--paper', th.paper);
    } else {
      r.removeProperty('--ink');
      r.removeProperty('--paper');
    }
    r.setProperty('--brand-soft', `color-mix(in oklab, ${th.primary} 12%, var(--card))`);
    r.setProperty('--accent-soft', `color-mix(in oklab, ${th.accent} 18%, var(--card))`);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', th.primary);
  }, [s.settings.theme]);
  return null;
}

/** Shows a toast when another tab (another role) changes something: real-time demo. */
export function LiveListener() {
  useStore();
  const last = useRef<number>(0);
  useEffect(() => {
    const r = store.lastRemote;
    if (r && r.at !== last.current) {
      last.current = r.at;
      const label = r.action.replace(/[._]/g, ' ');
      toast(`Live update from another session: ${label}`, 'info');
    }
  });
  return null;
}

export function AccessibilityMenu({ onChange }: { onChange?: () => void }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Prefs>(loadPrefs);
  const update = (patch: Partial<Prefs>) => { const n = { ...p, ...patch }; setP(n); applyPrefs(n); onChange?.(); };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold hover:bg-ink/5" aria-expanded={open} aria-label="Accessibility and language">
        <Accessibility size={18} /> <span className="hidden lg:inline">{p.lang === 'tn' ? 'Setswana' : 'Access'}</span>
      </button>
      {open && (
        <div className="rise absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-card p-4 shadow-xl">
          <div className="mb-3 text-sm font-bold">Make it easier to use</div>
          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold text-muted">Text size</div>
            <div className="flex gap-1">
              {[0.9, 1, 1.15, 1.3].map((s) => (
                <button key={s} onClick={() => update({ scale: s })} className={`flex-1 rounded-lg border px-2 py-1 font-bold ${p.scale === s ? 'border-brand bg-brand-soft' : 'border-line'}`} style={{ fontSize: 12 * s }}>A</button>
              ))}
            </div>
          </div>
          {([['contrast', 'High contrast'], ['dark', 'Dark mode'], ['dyslexia', 'Dyslexia-friendly text']] as const).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between py-1.5 text-sm">
              {label}
              <input type="checkbox" checked={p[k]} onChange={(e) => update({ [k]: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
            </label>
          ))}
          <div className="mt-2 border-t border-line pt-3">
            <div className="mb-1 text-xs font-semibold text-muted">Language for menus</div>
            <div className="flex gap-1">
              {(['en', 'tn'] as const).map((l) => (
                <button key={l} onClick={() => update({ lang: l })} className={`flex-1 rounded-lg border px-2 py-1 text-sm font-semibold ${p.lang === l ? 'border-brand bg-brand-soft' : 'border-line'}`}>{l === 'en' ? 'English' : 'Setswana'}</button>
              ))}
            </div>
          </div>
          <button onClick={() => { const txt = document.querySelector('main')?.innerText ?? ''; speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(txt.slice(0, 3000))); }} className="mt-3 w-full rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-ink/5">
            Read this page aloud
          </button>
        </div>
      )}
    </div>
  );
}

export const DEMO_ACCOUNTS = [
  { id: 'u_innovator', role: 'Innovator', who: 'Kagiso Molefe', does: 'Submit, track, reply to feedback, resubmit' },
  { id: 'u_reviewer', role: 'Reviewer', who: 'Dr Lesego Ntsima', does: 'Declare conflicts, score blind' },
  { id: 'u_committee', role: 'Committee chair', who: 'Onalenna Dube', does: 'Compare calibrated scores, vote, decide, award' },
  { id: 'u_observer', role: 'Committee observer', who: 'Masego Phiri', does: 'External stakeholder: watch progress, read-only' },
  { id: 'u_consultant', role: 'CEDA consultant', who: 'Thato Keabetswe', does: 'Answer live chat, see chat analytics' },
  { id: 'u_admin', role: 'Administrator', who: 'Neo Mothibi', does: 'Calls, forms, content, users, roles, look, audit' },
  { id: 'u_staff1', role: 'CEDA staff innovator', who: 'Ame Lebotse', does: 'Submit to staff-only campaigns' },
];

function DemoBar() {
  const me = useMe();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative z-40 bg-ink text-paper">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs">
        <span className="flex items-center gap-2"><Radio size={13} className="live-dot text-accent" /> <b>Demo mode.</b> <span className="hidden sm:inline opacity-80">All data is fictional and stays in your browser. Open two tabs as different roles to watch live updates.</span></span>
        <div className="flex items-center gap-1">
          <Link to="/judges" className="rounded-md px-2 py-1 font-semibold text-accent hover:bg-white/10">Judges’ guide</Link>
          <div className="relative">
            <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold hover:bg-white/10" aria-expanded={open}>
              {me ? `Viewing as ${me.name.split(' ')[0]}` : 'Switch role'} <ChevronDown size={13} />
            </button>
            {open && (
              <div className="absolute right-0 z-50 mt-1 w-72 rounded-xl border border-line bg-card p-1.5 text-ink shadow-xl">
                {DEMO_ACCOUNTS.map((a) => (
                  <button key={a.id} onClick={() => { demoLogin(a.id); setOpen(false); nav('/app'); }} className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-ink/5 ${me?.id === a.id ? 'bg-brand-soft' : ''}`}>
                    <Avatar name={a.who} size={26} />
                    <span><span className="block text-sm font-semibold">{a.role}</span><span className="block text-xs text-muted">{a.does}</span></span>
                  </button>
                ))}
                <div className="my-1 border-t border-line" />
                <button onClick={() => { logout(); setOpen(false); nav('/'); }} className="w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-ink/5">Sign out (public view)</button>
              </div>
            )}
          </div>
          <button onClick={() => { if (confirmReset()) { resetDemo(); toast('Demo data reset'); nav('/'); } }} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10" title="Reset demo data"><RotateCcw size={13} /> <span className="hidden sm:inline">Reset</span></button>
        </div>
      </div>
    </div>
  );
}

function confirmReset() {
  // window.confirm is avoided (blocking dialogs); a second click within 4s confirms.
  const k = 'letsema:reset-armed';
  const armed = Number(sessionStorage.getItem(k) ?? 0);
  if (Date.now() - armed < 4000) { sessionStorage.removeItem(k); return true; }
  sessionStorage.setItem(k, String(Date.now()));
  toast('Click Reset again to restore the original demo data.', 'info');
  return false;
}

function Notices() {
  const s = useStore();
  const n = s.notices.find((x) => x.active);
  if (!n) return null;
  return (
    <div className={`border-b border-line text-sm ${n.tone === 'warning' ? 'bg-amber-100 text-amber-950' : n.tone === 'success' ? 'bg-emerald-50 text-emerald-950' : 'bg-accent-soft'}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2"><Megaphone size={15} className="shrink-0" /><b>{n.title}.</b> <span className="text-ink/80">{n.body}</span></div>
    </div>
  );
}

export function PublicLayout() {
  const me = useMe();
  const [, force] = useState(0);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [loc.pathname]);
  const links = [
    { to: '/calls', label: t('Open calls') },
    { to: '/ideas', label: t('Idea bank') },
    { to: '/track', label: t('Track an idea') },
    { to: '/how', label: t('How it works') },
    { to: '/help', label: t('Help') },
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Skip to content</a>
      <DemoBar />
      <Notices />
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" aria-label="Letsema home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-soft text-brand' : 'text-ink/80 hover:bg-ink/5'}`}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <AccessibilityMenu onChange={() => force((x) => x + 1)} />
            {me ? (
              <Link to="/app" className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-brand-ink"><Avatar name={me.name} size={22} /> <span className="hidden sm:inline">{t('My workspace')}</span></Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold hover:bg-ink/5 sm:inline-flex">{t('Sign in')}</Link>
                <Link to="/register" className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-brand-ink">{t('Create account')}</Link>
              </>
            )}
            <button className="rounded-xl p-2 md:hidden" onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-line px-4 py-2 md:hidden" aria-label="Mobile">
            {links.map((l) => <NavLink key={l.to} to={l.to} className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-ink/5">{l.label}</NavLink>)}
            {!me && <NavLink to="/login" className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-ink/5">{t('Sign in')}</NavLink>}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <ChatWidget />
      <Toaster />
      <LiveListener />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">The innovation portal of the Citizen Entrepreneurial Development Agency. Ideas in, fairly judged, funded and grown.</p>
          <p className="mt-3 text-xs text-muted">Hackathon prototype. All people, companies and ideas shown are fictional.</p>
        </div>
        <FooterCol title="Take part" links={[['/calls', 'Open calls'], ['/register', 'Create an account'], ['/track', 'Track an idea'], ['/verify', 'Check a receipt or award']]} />
        <FooterCol title="Learn" links={[['/how', 'How evaluation works'], ['/ideas', 'Idea bank'], ['/help', 'FAQs and contacts'], ['/page/about', 'About Letsema']]} />
        <FooterCol title="Trust" links={[['/privacy', 'Privacy & data protection'], ['/status', 'System status & hosting'], ['/help#support', 'Support & turnaround times'], ['/page/terms', 'Terms of use']]} />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold">{title}</div>
      <ul className="space-y-1.5 text-sm">{links.map(([to, l]) => <li key={to}><Link className="text-muted hover:text-ink hover:underline" to={to}>{l}</Link></li>)}</ul>
    </div>
  );
}

// ---------------------------------------------------------------- signed-in workspace

interface NavItem { to: string; label: string; icon: ReactNode; perm?: Permission; roles?: string[]; badge?: number }

export function AppLayout() {
  const me = useMe();
  const s = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { if (!me) nav('/login', { replace: true, state: { from: loc.pathname } }); }, [me, nav, loc.pathname]);
  if (!me) return null;
  const reviewQueue = s.ideas.filter((i) => i.status === 'in_review' && i.assignments.some((a) => a.reviewerId === me.id && !a.conflict?.declared) && !i.reviews.some((r) => r.reviewerId === me.id && r.round === i.round)).length;
  const committeeQueue = s.ideas.filter((i) => i.status === 'committee' && !i.decision?.votes?.[me.id]).length;
  const waitingChats = s.conversations.filter((c) => c.status === 'waiting').length;
  const items: NavItem[] = [
    { to: '/app', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { to: '/app/ideas', label: 'My ideas', icon: <Lightbulb size={18} />, perm: 'idea.create' },
    { to: '/app/review', label: 'Review queue', icon: <ClipboardCheck size={18} />, perm: 'review.submit', badge: reviewQueue },
    { to: '/app/pipeline', label: 'Pipeline board', icon: <KanbanSquare size={18} />, perm: 'idea.view.pipeline', badge: can(s, me, 'idea.decide') ? committeeQueue : undefined },
    { to: '/app/chat', label: 'Live chat', icon: <MessagesSquare size={18} />, perm: 'chat.answer', badge: waitingChats },
    { to: '/app/reports', label: 'Reports', icon: <BarChart3 size={18} />, perm: 'reports.view' },
    { to: '/app/admin/calls', label: 'Calls & forms', icon: <Sprout size={18} />, perm: 'campaign.manage' },
    { to: '/app/admin/content', label: 'Content', icon: <FileText size={18} />, perm: 'content.manage' },
    { to: '/app/admin/users', label: 'Users & roles', icon: <Users size={18} />, perm: 'users.manage' },
    { to: '/app/admin/settings', label: 'Look & settings', icon: <Settings size={18} />, perm: 'settings.manage' },
    { to: '/app/privacy', label: 'Data protection', icon: <Shield size={18} />, perm: 'privacy.manage' },
    { to: '/app/audit', label: 'Audit trail', icon: <ScrollText size={18} />, perm: 'audit.view' },
  ];
  const visible = items.filter((i) => !i.perm || can(s, me, i.perm));
  const role = roleDef(s, me.role);
  const side = (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Workspace">
      <Link to="/" className="mb-4 px-2 pt-1"><Logo /></Link>
      {visible.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/app'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand text-brand-ink' : 'text-ink/80 hover:bg-ink/5'}`}>
          {i.icon}<span className="flex-1">{i.label}</span>
          {!!i.badge && <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-ink">{i.badge}</span>}
        </NavLink>
      ))}
      <div className="mt-auto space-y-1 border-t border-line pt-3">
        <NavLink to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5"><Home size={18} /> Public site</NavLink>
        <NavLink to="/inbox" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5"><Inbox size={18} /> Demo email & SMS</NavLink>
        <button onClick={() => { logout(); nav('/'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5"><LogOut size={18} /> Sign out</button>
      </div>
    </nav>
  );
  return (
    <div className="min-h-screen">
      <a href="#main" className="skip-link">Skip to content</a>
      <DemoBar />
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-card lg:block">{side}</aside>
        {open && (
          <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
            <aside className="h-full w-72 bg-card" onClick={(e) => e.stopPropagation()}>{side}</aside>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-paper/85 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
              <span className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
                {role?.internal ? <ShieldCheck size={15} className="text-brand" /> : <UserCircle2 size={15} />}
                Signed in as <b className="text-ink">{role?.label ?? me.role}</b>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AccessibilityMenu onChange={() => force((x) => x + 1)} />
              <NotificationBell />
              <Link to="/app/profile" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-ink/5"><Avatar name={me.name} size={30} /><span className="hidden text-sm font-semibold md:inline">{me.name}</span></Link>
            </div>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><Outlet /></main>
        </div>
      </div>
      {can(s, me, 'idea.create') && <ChatWidget />}
      <Toaster />
      <LiveListener />
    </div>
  );
}

function NotificationBell() {
  const me = useMe()!;
  const s = useStore();
  const [open, setOpen] = useState(false);
  const mine = s.notifications.filter((n) => n.userId === me.id).slice(0, 12);
  const unread = mine.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-xl p-2 hover:bg-ink/5" aria-label={`Notifications, ${unread} unread`} aria-expanded={open}>
        <Bell size={19} />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="rise absolute right-0 z-50 mt-2 w-[min(92vw,360px)] rounded-2xl border border-line bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <b className="text-sm">Notifications</b>
            <Link to="/app/profile#alerts" onClick={() => setOpen(false)} className="text-xs font-semibold text-brand">Alert settings</Link>
          </div>
          <ul className="max-h-96 overflow-auto">
            {mine.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Nothing yet.</li>}
            {mine.map((n) => (
              <li key={n.id}>
                <Link to={n.link ?? '/app'} onClick={() => { setOpen(false); import('../core/actions').then((a) => a.markRead(me, n.id)); }} className={`block border-b border-line/60 px-4 py-3 hover:bg-ink/5 ${n.read ? '' : 'bg-brand-soft/60'}`}>
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs text-muted">{n.body}</div>
                  <div className="mt-1 text-[11px] text-muted">{ago(n.at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

