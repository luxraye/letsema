import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Logo } from './logo';

export function SiteFooter() {
  const cols = [
    ['Apply', [['/instances', 'Open competitions'], ['/eligibility', 'Eligibility checker'], ['/register', 'Create an account'], ['/track', 'Track my idea']]],
    ['The programme', [['/page/about', 'About'], ['/judges', 'How to judge this portal'], ['/how-it-works', 'How judging works'], ['/funded', 'Funded innovators'], ['/privacy', 'Privacy notice']]],
    ['Help', [['/help', 'Help and FAQs'], ['/help#support', 'Report a problem'], ['/community', 'Community'], ['/status', 'Status and hosting']]],
  ] as const;
  const external = [['https://www.ceda.co.bw', 'CEDA'], ['https://www.cipa.co.bw', 'CIPA company registry']] as const;
  return (
    <footer className="bg-ink text-white/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo dark sub />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed">One place for Batswana to submit ideas, be scored fairly, follow their application and get funded. A CEDA hackathon 2026 prototype; demo data is fictional.</p>
        </div>
        {cols.map(([h, links]) => (
          <div key={h}>
            <div className="mb-3 font-semibold text-white">{h}</div>
            <ul className="space-y-2.5 text-[15px]">{links.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul>
            {h === 'Help' && <ul className="mt-2.5 space-y-2.5 text-[15px]">{external.map(([href, label]) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">{label}<ExternalLink size={12} className="opacity-60" /></a></li>)}</ul>}
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 px-4 py-6 text-[13px] text-white/60 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <span>© 2026 CEDA Innovation Portal · Demo emails and SMS go to the <Link className="underline" href="/demo-inbox">demo inbox</Link></span>
        <span>Personal data handled under the Data Protection Act, 2024</span>
      </div>
    </footer>
  );
}
