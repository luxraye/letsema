import Link from 'next/link';
import { Logo } from './logo';

export function SiteFooter() {
  const cols = [
    ['Compete', [['/instances', 'Open competitions'], ['/eligibility', 'Am I eligible?'], ['/funded', 'Funded innovators'], ['/track', 'Track an application']]],
    ['Learn', [['/how-it-works', 'How it works'], ['/help', 'Help and FAQs'], ['/community', 'Community'], ['/page/about', 'About']]],
    ['Trust', [['/status', 'Status and hosting'], ['/privacy', 'Privacy'], ['/verify', 'Verify an award'], ['/judges', 'For the judging panel']]],
  ] as const;
  return (
    <footer className="bg-ink text-white/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-3 max-w-xs text-sm">Citizen Entrepreneurial Development Agency innovation portal. A hackathon 2026 prototype; demo data is fictional.</p>
          <p className="mt-3 text-sm">Help: <Link className="underline" href="/help#support">report a problem</Link> or use live chat, Mon–Fri 09:00–16:00.</p>
        </div>
        {cols.map(([h, links]) => (
          <div key={h}>
            <div className="mb-3 text-sm font-bold text-white">{h}</div>
            <ul className="space-y-2 text-sm">{links.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">Demo emails and SMS go to the <Link className="underline" href="/demo-inbox">demo inbox</Link>. Photos: Unsplash licence (see credits on the status page).</div>
    </footer>
  );
}
