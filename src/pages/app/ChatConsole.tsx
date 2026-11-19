import { useEffect, useRef, useState } from 'react';
import { Send, X, Clock, Users } from 'lucide-react';
import { useMe, useStore, PageHeader, Button, Badge, Empty, Tabs, Avatar } from '../../ui/kit';
import { chatSend, claimChat, closeChat } from '../../core/actions';
import { availability } from '../../core/hours';
import { ago, fmtDateTime } from '../../core/util';
import { ChatReport } from './Reports';
import type { Conversation } from '../../core/types';

export default function ChatConsole() {
  const me = useMe()!;
  const s = useStore();
  const [tab, setTab] = useState<'live' | 'missed' | 'history' | 'analytics'>('live');
  const [openIds, setOpenIds] = useState<string[]>(() => s.conversations.filter((c) => c.status === 'active' && c.agentId === me.id).map((c) => c.id));
  const waiting = s.conversations.filter((c) => c.status === 'waiting');
  const mineActive = s.conversations.filter((c) => c.status === 'active' && c.agentId === me.id);
  const othersActive = s.conversations.filter((c) => c.status === 'active' && c.agentId !== me.id);
  const av = availability(new Date(), s.settings.chat);
  useEffect(() => { setOpenIds((ids) => [...new Set([...ids, ...mineActive.map((c) => c.id)])].filter((id) => s.conversations.find((c) => c.id === id && c.status === 'active'))); }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
  const take = (c: Conversation) => {
    if (mineActive.length >= s.settings.chat.maxPerAgent) return;
    claimChat(me, c.id);
    setOpenIds((ids) => [...ids, c.id]);
  };
  return (
    <div>
      <PageHeader eyebrow="CEDA consultant" title="Live chat console" sub={`Handle up to ${s.settings.chat.maxPerAgent} chats at once. Visitors see “all consultants busy” when every agent is full, and an after-hours message outside ${s.settings.chat.open}–${s.settings.chat.close} on working days.`}
        actions={<Badge tone={av.open ? 'emerald' : 'amber'}><Clock size={12} /> {av.open ? 'Within chat hours' : 'Outside chat hours'} · {av.local}</Badge>} />
      <Tabs value={tab} onChange={setTab} items={[{ key: 'live', label: `Live (${waiting.length + mineActive.length})` }, { key: 'missed', label: `After-hours (${s.conversations.filter((c) => c.status === 'missed').length})` }, { key: 'history', label: 'History' }, { key: 'analytics', label: 'Analytics' }]} />
      <div className="mt-5">
        {tab === 'live' && (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <div className="card p-3">
                <div className="mb-2 px-1 text-sm font-bold">Waiting ({waiting.length})</div>
                {waiting.map((c) => (
                  <button key={c.id} onClick={() => take(c)} className="mb-1.5 w-full rounded-xl border border-line p-3 text-left text-sm hover:border-brand">
                    <div className="flex justify-between"><b>{c.visitorName}</b><span className="text-xs text-muted">{ago(c.startedAt)}</span></div>
                    <div className="text-xs text-muted">{c.topic}</div>
                    <div className="mt-1 line-clamp-2">{c.messages[0]?.body}</div>
                    <div className="mt-1 text-xs font-semibold text-brand">{mineActive.length >= s.settings.chat.maxPerAgent ? 'You are at your limit' : 'Take this chat →'}</div>
                  </button>
                ))}
                {!waiting.length && <p className="px-1 text-sm text-muted">No one waiting.</p>}
              </div>
              <div className="card p-3 text-sm"><div className="mb-1 flex items-center gap-1.5 font-bold"><Users size={15} /> Other consultants</div>{othersActive.length ? othersActive.map((c) => <div key={c.id} className="text-muted">{s.users.find((u) => u.id === c.agentId)?.name} ↔ {c.visitorName}</div>) : <p className="text-muted">No other active chats.</p>}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {openIds.map((id) => { const c = s.conversations.find((x) => x.id === id); return c ? <ChatPane key={id} c={c} onClose={() => setOpenIds(openIds.filter((x) => x !== id))} /> : null; })}
              {!openIds.length && <div className="md:col-span-2"><Empty title="No open conversations">Take a waiting chat to start. Tip: open the site in another tab as a visitor and start a chat; it appears here instantly.</Empty></div>}
            </div>
          </div>
        )}
        {tab === 'missed' && <List items={s.conversations.filter((c) => c.status === 'missed')} />}
        {tab === 'history' && <List items={s.conversations.filter((c) => c.status === 'closed')} />}
        {tab === 'analytics' && <ChatReport s={s} />}
      </div>
    </div>
  );
}

function ChatPane({ c, onClose }: { c: Conversation; onClose: () => void }) {
  const me = useMe()!;
  const [msg, setMsg] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [c.messages.length]);
  const quick = ['Dumela! How can I help?', 'Let me check that for you.', 'You can find this under Help › FAQs.', 'Is there anything else I can help with?'];
  return (
    <div className="card flex h-[460px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2"><Avatar name={c.visitorName} size={26} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{c.visitorName}</div><div className="text-xs text-muted">{c.topic}</div></div><Button size="sm" variant="ghost" onClick={() => { closeChat(c.id, me); onClose(); }}>End</Button><button onClick={onClose} aria-label="Hide"><X size={16} /></button></div>
      <div className="flex-1 space-y-2 overflow-auto bg-paper p-3">
        {c.messages.map((m, i) => <div key={i} className={`flex ${m.from === 'agent' ? 'justify-end' : m.from === 'system' ? 'justify-center' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${m.from === 'agent' ? 'bg-brand text-brand-ink' : m.from === 'system' ? 'text-xs text-muted' : 'bg-card shadow-sm'}`}>{m.body}</div></div>)}
        <div ref={end} />
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-line px-2 py-1.5">{quick.map((q) => <button key={q} onClick={() => chatSend(c.id, 'agent', q, me)} className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs hover:bg-ink/5">{q}</button>)}</div>
      <form className="flex gap-2 border-t border-line p-2" onSubmit={(e) => { e.preventDefault(); chatSend(c.id, 'agent', msg, me); setMsg(''); }}>
        <input className="field py-2" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Reply…" aria-label={`Reply to ${c.visitorName}`} /><Button type="submit" size="sm" disabled={!msg.trim()} aria-label="Send"><Send size={15} /></Button>
      </form>
    </div>
  );
}

function List({ items }: { items: Conversation[] }) {
  return (
    <div className="card divide-y divide-line">
      {items.slice(0, 40).map((c) => (
        <details key={c.id} className="px-4 py-3">
          <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm"><span><b>{c.visitorName}</b> · {c.topic}</span><span className="text-xs text-muted">{fmtDateTime(c.startedAt)}{c.rating ? ` · ${c.rating}★` : ''}</span></summary>
          <div className="mt-2 space-y-1 text-sm">{c.messages.map((m, i) => <p key={i}><b className="text-muted">{m.from}:</b> {m.body}</p>)}</div>
        </details>
      ))}
      {!items.length && <p className="p-4 text-sm text-muted">Nothing here.</p>}
    </div>
  );
}
