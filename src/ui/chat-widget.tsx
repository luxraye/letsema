import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Clock, Star } from 'lucide-react';
import { useMe, useStore, Button } from './kit';
import { availability } from '../core/hours';
import { chatSend, closeChat, startChat } from '../core/actions';
import { fmtDateTime } from '../core/util';

const CONV = 'letsema:chat';

export function useChatClock() {
  const [simulate, setSimulate] = useState(() => sessionStorage.getItem('letsema:sim-hours') === '1');
  const toggle = () => { const n = !simulate; setSimulate(n); sessionStorage.setItem('letsema:sim-hours', n ? '1' : '0'); };
  return { simulate, toggle };
}

export function ChatWidget() {
  const s = useStore();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(() => sessionStorage.getItem(CONV));
  const { simulate, toggle } = useChatClock();
  const avail = availability(new Date(), s.settings.chat);
  const isOpen = avail.open || simulate;
  const conv = s.conversations.find((c) => c.id === convId);
  const [name, setName] = useState(me?.name ?? '');
  const [topic, setTopic] = useState('Application form');
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [conv?.messages.length, open]);
  useEffect(() => { if (me && !name) setName(me.name); }, [me, name]);

  const begin = () => {
    if (!msg.trim()) return;
    const id = startChat({ name, userId: me?.id, topic, message: msg, open: isOpen, offlineMessage: avail.message });
    sessionStorage.setItem(CONV, id);
    setConvId(id);
    setMsg('');
  };
  const leave = (rating?: number) => {
    if (conv) closeChat(conv.id, me ?? null, rating);
    sessionStorage.removeItem(CONV);
    setConvId(null);
  };
  const agentName = conv?.agentId ? s.users.find((u) => u.id === conv.agentId)?.name : undefined;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 font-semibold text-brand-ink shadow-xl hover:brightness-110" aria-label="Open live chat with a CEDA consultant">
          <MessageCircle size={20} /> <span className="hidden sm:inline">Chat with CEDA</span>
          <span className={`h-2.5 w-2.5 rounded-full ${isOpen ? 'bg-emerald-300 live-dot' : 'bg-slate-400'}`} aria-hidden />
        </button>
      )}
      {open && (
        <div className="rise fixed bottom-0 right-0 z-50 flex h-[min(620px,100dvh)] w-full flex-col overflow-hidden bg-card shadow-2xl sm:bottom-4 sm:right-4 sm:w-[380px] sm:rounded-2xl sm:border sm:border-line" role="dialog" aria-label="Live chat">
          <div className="flex items-start justify-between gap-2 bg-brand px-4 py-3 text-brand-ink">
            <div>
              <div className="font-bold">CEDA live chat</div>
              <div className="flex items-center gap-1.5 text-xs opacity-90">
                <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-300' : 'bg-slate-300'}`} />
                {isOpen ? (agentName ? `${agentName} is helping you` : 'Consultants online') : 'Consultants offline'} · {s.settings.chat.open}–{s.settings.chat.close}, Mon–Fri
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/15" aria-label="Close chat"><X size={18} /></button>
          </div>
          {!conv ? (
            <div className="flex-1 space-y-3 overflow-auto p-4">
              {!isOpen && (
                <div className="flex gap-2 rounded-xl bg-amber-100 p-3 text-sm text-amber-950"><Clock size={16} className="mt-0.5 shrink-0" />{avail.message}</div>
              )}
              <div className="rounded-xl bg-paper p-3 text-xs text-muted">
                It is {avail.local}. <button className="font-semibold text-brand underline" onClick={toggle}>{simulate ? 'Use the real clock' : 'Demo: simulate working hours'}</button>
              </div>
              <label className="label" htmlFor="chat-name">Your name</label>
              <input id="chat-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
              <label className="label" htmlFor="chat-topic">What is it about?</label>
              <select id="chat-topic" className="field" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {['Application form', 'Eligibility', 'Documents', 'Funding amounts', 'Status of my idea', 'Password reset', 'Technical problem', 'Something else'].map((t) => <option key={t}>{t}</option>)}
              </select>
              <label className="label" htmlFor="chat-msg">Message</label>
              <textarea id="chat-msg" className="field min-h-24" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Dumela! How can we help?" />
              <Button className="w-full" onClick={begin} disabled={!msg.trim() || !name.trim()}>{isOpen ? 'Start chat' : 'Leave a message'}</Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-auto bg-paper p-3" aria-live="polite">
                {conv.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'visitor' ? 'justify-end' : m.from === 'system' ? 'justify-center' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === 'visitor' ? 'bg-brand text-brand-ink' : m.from === 'system' ? 'bg-transparent text-center text-xs text-muted' : 'bg-card shadow-sm'}`}>
                      {m.body}
                      {m.from !== 'system' && <div className="mt-0.5 text-[10px] opacity-70">{fmtDateTime(m.at)}</div>}
                    </div>
                  </div>
                ))}
                <div ref={end} />
              </div>
              {conv.status === 'closed' || conv.status === 'missed' ? (
                <div className="space-y-2 border-t border-line p-3 text-center text-sm">
                  <p className="text-muted">{conv.status === 'missed' ? 'Message received. We will reply on the next working day.' : 'Chat ended. How did we do?'}</p>
                  {conv.status === 'closed' && !conv.rating && (
                    <div className="flex justify-center gap-1">{[1, 2, 3, 4, 5].map((r) => <button key={r} onClick={() => leave(r)} aria-label={`${r} stars`} className="text-accent hover:scale-110"><Star size={22} /></button>)}</div>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => leave()}>Start a new chat</Button>
                </div>
              ) : (
                <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); chatSend(conv.id, 'visitor', reply); setReply(''); }}>
                  <input className="field" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a message" aria-label="Message" />
                  <Button type="submit" aria-label="Send" disabled={!reply.trim()}><Send size={16} /></Button>
                  <Button type="button" variant="ghost" onClick={() => closeChat(conv.id, me ?? null)}>End</Button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
