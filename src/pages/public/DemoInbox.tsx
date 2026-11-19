import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { useStore, PageHeader, Empty, Tabs } from '../../ui/kit';
import { fmtDateTime } from '../../core/util';

export default function DemoInbox() {
  const s = useStore();
  const [tab, setTab] = useState<'all' | 'email' | 'sms'>('all');
  const list = s.outbox.filter((m) => tab === 'all' || m.channel === tab).slice(0, 80);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader eyebrow="Demo only" title="Demo email & SMS inbox" sub="In production these go out through an email and SMS gateway. Here they land in this inbox so you can complete sign-up, one-time-code sign-in and password reset without a real phone." />
      <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All' }, { key: 'email', label: 'Email' }, { key: 'sms', label: 'SMS' }]} />
      <ul className="mt-5 space-y-3">
        {list.map((m) => (
          <li key={m.id} className="card p-4">
            <div className="flex items-center gap-2 text-xs text-muted">{m.channel === 'email' ? <Mail size={14} /> : <MessageSquare size={14} />} To <b className="text-ink">{m.to}</b> · {fmtDateTime(m.at)}</div>
            <div className="mt-1 font-semibold">{m.subject}</div>
            <p className="mt-1 text-sm">{m.body.split(/(\b\d{6}\b)/).map((part, i) => /^\d{6}$/.test(part) ? <b key={i} className="rounded bg-accent-soft px-1 font-mono text-base">{part}</b> : part)}</p>
          </li>
        ))}
      </ul>
      {!list.length && <Empty title="Nothing sent yet">Create an account or request a sign-in code and the message will appear here.</Empty>}
    </div>
  );
}
