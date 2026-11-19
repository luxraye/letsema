import { useMe, useStore, PageHeader, Section, Button, Badge, attempt, Stat } from '../../ui/kit';
import { resolvePrivacy } from '../../core/actions';
import { fmtDate } from '../../core/util';

export default function PrivacyDesk() {
  const me = useMe()!;
  const s = useStore();
  const r = s.settings.retentionMonths;
  const consented = s.users.filter((u) => u.consentAt).length;
  return (
    <div>
      <PageHeader eyebrow="Data Protection Act, 2024" title="Data protection desk" sub="Requests from data subjects, consent records and the retention schedule." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Open requests" value={s.privacy.filter((p) => p.status === 'open').length} />
        <Stat label="Consent on record" value={`${consented}/${s.users.length}`} />
        <Stat label="Passkey users" value={s.users.filter((u) => u.passkeys.length).length} hint="Phishing-resistant sign-in" />
      </div>
      <Section title="Requests">
        <div className="divide-y divide-line">{s.privacy.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <Badge tone={p.kind === 'erase' ? 'rose' : p.kind === 'export' ? 'sky' : 'amber'}>{p.kind}</Badge>
            <div className="min-w-0 flex-1"><b>{s.users.find((u) => u.id === p.userId)?.name}</b>{p.note && <span className="text-muted"> · {p.note}</span>}<div className="text-xs text-muted">{fmtDate(p.at)}</div></div>
            {p.status === 'open' ? <Button size="sm" onClick={() => attempt(() => resolvePrivacy(me, p.id), p.kind === 'erase' ? 'Personal details erased; anonymous records kept' : 'Marked done')}>{p.kind === 'erase' ? 'Erase personal data' : 'Mark done'}</Button> : <Badge tone="emerald">done</Badge>}
          </div>
        ))}</div>
      </Section>
      <Section title="Retention schedule" className="mt-5">
        <table className="w-full text-sm"><tbody>
          {[['Applications and evaluation records', r.applications], ['Unsuccessful applications', r.declined], ['Live chat transcripts', r.chat], ['Audit trail', r.audit]].map(([k, v]) => <tr key={k as string} className="border-t border-line"><td className="py-2">{k}</td><td className="py-2 text-right font-semibold">{Number(v) >= 12 ? `${Number(v) / 12} years` : `${v} months`}</td></tr>)}
        </tbody></table>
        <p className="mt-3 text-xs text-muted">After the period ends, records are deleted or anonymised by a scheduled job. Erasure pseudonymises a person (name, email, phone, organisation) so scores and the audit chain remain valid without identifying them.</p>
      </Section>
    </div>
  );
}
