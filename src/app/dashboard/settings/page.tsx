import { desc } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireUser } from '@/lib/session';
import { PageHeader, Badge } from '@/components/ui';
import { getTheme, PRESETS, FONTS } from '@/lib/settings';
import { ThemeForm, KeyForm } from './forms';
import { revokeApiKey } from '@/app/actions/admin';
import { fmtDate } from '@/lib/format';
import { CHAT_HOURS, HOLIDAYS } from '@/lib/hours';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  await requireUser({ perm: 'settings.manage' });
  const theme = await getTheme();
  const keys = await db.select().from(schema.apiKeys).orderBy(desc(schema.apiKeys.createdAt));
  return (
    <div className="space-y-6">
      <PageHeader title="Look and settings" sub="CEDA decides the layout colours, fonts and corner style. Changes apply to every page immediately, for everyone." />
      <ThemeForm theme={theme} presets={PRESETS} fonts={FONTS} />
      <section className="card p-5 text-sm">
        <h2 className="mb-1 text-lg font-bold">Live chat hours</h2>
        <p className="text-muted">Consultants answer Monday to Friday, {String(CHAT_HOURS.open).padStart(2, '0')}:00 to {CHAT_HOURS.close}:00 Botswana time. Outside these hours, and on these public holidays, the chat says no agent is available and takes a message:</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-3">{Object.entries(HOLIDAYS).map(([d, n]) => <li key={d}><span className="mono text-xs">{d}</span> {n}</li>)}</ul>
      </section>
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-bold">API keys</h2>
        <p className="mb-3 text-sm text-muted">For partners and CEDA systems to read competitions and application statuses. Only a fingerprint of each key is stored. See <a className="underline" href="/api/v1">/api/v1</a>.</p>
        <ul className="mb-3 space-y-1 text-sm">{keys.map((k) => <li key={k.id} className="flex items-center gap-2"><span className="mono">{k.prefix}…</span> {k.name} · {fmtDate(k.createdAt)} {k.revokedAt ? <Badge tone="red">revoked</Badge> : <form action={revokeApiKey.bind(null, k.id)}><button className="text-xs underline">Revoke</button></form>}</li>)}</ul>
        <KeyForm />
      </section>
    </div>
  );
}
