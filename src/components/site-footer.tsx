import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Logo, LogoMark } from './logo';

export function SiteFooter() {
  const cols = [
    ['Apply', [['/instances', 'Open competitions'], ['/eligibility', 'Which can I enter?'], ['/register', 'Create an account'], ['/track', 'Track my idea']]],
    ['The programme', [['/page/about', 'About'], ['/judges', 'How to judge this portal'], ['/how-it-works', 'How judging works'], ['/funded', 'Funded innovators'], ['/privacy', 'Privacy notice']]],
    ['Help', [['/help', 'Help and FAQs'], ['/help#support', 'Report a problem'], ['/dial', 'No data? Dial *161#'], ['/community', 'Community'], ['/status', 'Status and hosting']]],
  ] as const;
  const partners = [['https://www.cipa.co.bw', 'CIPA company registry'], ['https://www.lea.co.bw', 'Local Enterprise Authority'], ['https://www.bdih.co.bw', 'Botswana Digital & Innovation Hub']] as const;
  return (
    <footer className="relative overflow-hidden bg-ink text-white/75">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--t-brand-2)] to-transparent opacity-70" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--t-aura-1),transparent)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.1fr] lg:px-8">
        <div>
          <Logo dark sub />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed">One place for Batswana to submit ideas, be scored fairly, follow their application and get funded. A CEDA hackathon 2026 prototype; demo data is fictional.</p>
        </div>
        {cols.map(([h, links]) => (
          <div key={h}>
            <div className="mb-3 font-semibold text-white">{h}</div>
            <ul className="space-y-2.5 text-[15px]">{links.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul>
          </div>
        ))}
        <div>
          <a href="https://www.ceda.co.bw" target="_blank" rel="noopener noreferrer" className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/25 hover:bg-white/[0.07]">
            <LogoMark className="h-9 w-[58px]" />
            <span className="leading-tight"><span className="block text-[11px] uppercase tracking-[0.16em] text-white/55">Built for</span><span className="font-display block text-lg font-bold tracking-[0.06em] text-white">CEDA</span></span>
          </a>
          <div className="mb-3 font-semibold text-white">Partners</div>
          <ul className="space-y-2.5 text-[15px]">{partners.map(([href, label]) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">{label}<ExternalLink size={12} className="opacity-60" /></a></li>)}</ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 px-4 py-6 text-[13px] text-white/60 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <span>© 2026 CEDA Innovation Portal · Demo emails and SMS go to the <Link className="underline" href="/demo-inbox">demo inbox</Link></span>
        <span>Personal data handled under the Data Protection Act, 2024</span>
      </div>
    </footer>
  );
}
