import { useEffect, useState } from 'react';
import { Activity, Cloud, Database, Gauge, HardDrive, MapPin, Server } from 'lucide-react';
import { useStore, PageHeader, Badge } from '../../ui/kit';
import { verifyChain } from '../../core/store';
import { ideaScore, reviewerStats, globalStats } from '../../core/scoring';

export const HOSTING = {
  provider: 'Microsoft Azure',
  region: 'South Africa North (Johannesburg), with South Africa West (Cape Town) for disaster recovery',
  why: 'The nearest hyperscale region to Gaborone, for low latency. The Data Protection Act, 2024 controls transfers of personal data outside Botswana, so the production plan records the transfer safeguards and keeps an in-country hosting option open if CEDA requires it.',
  costs: [
    { item: 'App containers (2 instances, autoscaling to 6)', usd: 70 },
    { item: 'PostgreSQL Flexible Server, 2 vCPU, 64 GB storage, 7-day backups', usd: 75 },
    { item: 'Blob storage for documents (100 GB, geo-redundant)', usd: 6 },
    { item: 'Front Door CDN + web application firewall', usd: 40 },
    { item: 'Monitoring, logs and alerts', usd: 15 },
    { item: 'Email and SMS gateway', usd: 25 },
  ],
};

export default function Status() {
  const s = useStore();
  const [timing, setTiming] = useState<{ q: number; rank: number; chain: number } | null>(null);
  useEffect(() => {
    const t0 = performance.now();
    s.ideas.filter((i) => i.status === 'in_review');
    const t1 = performance.now();
    const st = reviewerStats(s), g = globalStats(s);
    s.ideas.forEach((i) => ideaScore(s, i, st, g));
    const t2 = performance.now();
    verifyChain(s.audit);
    const t3 = performance.now();
    setTiming({ q: t1 - t0, rank: t2 - t1, chain: t3 - t2 });
  }, [s]);
  const total = HOSTING.costs.reduce((a, c) => a + c.usd, 0);
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="Status & hosting" title="Is everything working?" sub="Live health of this preview, and how production is hosted, where the data lives, and what it costs." />
      <div className="card flex items-center gap-3 p-5"><span className="live-dot h-3 w-3 rounded-full bg-emerald-500" /><b>All systems operational</b><span className="ml-auto text-sm text-muted">Target availability 99.9% · 24/7</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric icon={<Gauge size={16} />} label="Page load (this visit)" value={nav ? `${Math.round(nav.domContentLoadedEventEnd)} ms` : '—'} />
        <Metric icon={<Activity size={16} />} label="Pipeline query" value={timing ? `${timing.q.toFixed(2)} ms` : '…'} />
        <Metric icon={<Activity size={16} />} label={`Score & calibrate ${s.ideas.length} ideas`} value={timing ? `${timing.rank.toFixed(1)} ms` : '…'} />
        <Metric icon={<Activity size={16} />} label={`Verify ${s.audit.length} audit links`} value={timing ? `${timing.chain.toFixed(1)} ms` : '…'} />
      </div>
      <p className="mt-2 text-xs text-muted">Measured live in your browser. In this preview, the app is served as static files from GitHub Pages’ global CDN and the demo data stays on your device.</p>

      <h2 className="mt-10 text-xl font-bold">Production hosting plan</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card p-5 space-y-3 text-sm">
          <Row icon={<Cloud size={16} />} k="Cloud provider" v={HOSTING.provider} />
          <Row icon={<MapPin size={16} />} k="Data region" v={HOSTING.region} />
          <Row icon={<Server size={16} />} k="Application" v="Stateless containers behind a CDN and firewall; scales out on load" />
          <Row icon={<Database size={16} />} k="Database" v="Managed PostgreSQL, encrypted at rest, point-in-time restore, daily geo-backups" />
          <Row icon={<HardDrive size={16} />} k="Files" v="Object storage, encrypted, virus-scanned on upload, SHA-256 fingerprinted" />
          <p className="rounded-xl bg-paper p-3 text-muted">{HOSTING.why}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><b>Estimated monthly cost</b><Badge tone="amber">Estimate</Badge></div>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {HOSTING.costs.map((c) => <tr key={c.item} className="border-b border-line/70"><td className="py-2 pr-3">{c.item}</td><td className="py-2 text-right tabular-nums">${c.usd}</td></tr>)}
              <tr><td className="pt-3 font-bold">Total</td><td className="pt-3 text-right font-bold tabular-nums">${total} / month</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">Indicative list-price estimate for about 5,000 applicants a year; confirm with a provider quote before contracting. Storage grows by roughly 1 GB per 300 applications with attachments.</p>
        </div>
      </div>
      <div className="card mt-4 grid gap-4 p-5 text-sm sm:grid-cols-3">
        <div><b>Recovery point</b><p className="text-muted">≤ 5 minutes of data (continuous backup)</p></div>
        <div><b>Recovery time</b><p className="text-muted">≤ 4 hours to the standby region</p></div>
        <div><b>Monitoring</b><p className="text-muted">Uptime checks every minute; on-call alerting for P1</p></div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card p-4"><div className="flex items-center gap-1.5 text-xs font-semibold text-muted">{icon}{label}</div><div className="mt-1 font-display text-xl font-extrabold tabular-nums">{value}</div></div>;
}
function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-brand">{icon}</span><div><div className="font-semibold">{k}</div><div className="text-muted">{v}</div></div></div>;
}
