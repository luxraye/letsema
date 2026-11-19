'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Star } from 'lucide-react';

type Msg = { id: string; from: 'user' | 'consultant' | 'system'; body: string; at: string };
type Chat = { id: string; status: string; topic: string; consultant: string | null; messages: Msg[] };
const KEY = 'ceda:chat';
const TOPICS = ['Eligibility', 'Applying', 'Documents', 'Application status', 'Technical problem', 'General'];

export function ChatWidget({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState<{ open: boolean; reason: string } | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [guest, setGuest] = useState({ name: '', contact: '' });
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const poll = async () => {
    let id: string | null = null; try { id = localStorage.getItem(KEY); } catch {}
    const r = await fetch(`/api/chat${id ? `?id=${id}` : ''}`).then((x) => x.json()).catch(() => null);
    if (!r) return;
    setHours(r.hours);
    if (r.chat) setChat(r.chat); else if (id) { try { localStorage.removeItem(KEY); } catch {} }
  };
  useEffect(() => { poll(); }, []);
  useEffect(() => { if (!open) return; const t = setInterval(poll, 3000); return () => clearInterval(t); }, [open]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [chat?.messages.length, open]);

  const post = async (body: object) => {
    setBusy(true);
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.chat) { setChat(r.chat); try { localStorage.setItem(KEY, r.chat.id); } catch {} }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) return;
    const body = text; setText('');
    if (!chat || chat.status === 'closed') await post({ action: 'start', topic, body, ...(signedIn ? {} : guest) });
    else await post({ action: 'send', id: chat.id, body });
  };
  const restart = () => { try { localStorage.removeItem(KEY); } catch {} setChat(null); };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 flex h-[32rem] max-h-[75dvh] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" role="dialog" aria-label="Live chat">
          <div className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
            <span className={`size-2.5 rounded-full ${hours?.open ? 'bg-emerald-400' : 'bg-stone-400'}`} />
            <div className="min-w-0 flex-1"><div className="text-sm font-bold">CEDA live chat</div><div className="truncate text-xs text-white/70">{chat?.consultant ? `With ${chat.consultant}` : hours?.reason ?? '…'}</div></div>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-sand/50 p-3 text-sm">
            {!chat && (
              <div className="rounded-xl bg-white p-3 text-muted">
                <b className="text-ink">Dumela!</b> Ask us anything about applying, documents or your application. {hours?.open ? 'A consultant usually replies within two minutes.' : 'We are offline now. Leave a message and we will reply by email or SMS on the next working day.'}
                <div className="mt-2 text-xs">Hours: Monday to Friday, 09:00 to 16:00 (not on public holidays).</div>
              </div>
            )}
            {chat?.messages.map((m) => (
              <div key={m.id} className={m.from === 'user' ? 'flex justify-end' : m.from === 'system' ? 'text-center text-xs text-muted' : 'flex'}>
                {m.from === 'system' ? <span>{m.body}</span> : <span className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.from === 'user' ? 'bg-[var(--brand)] text-white' : 'bg-white'}`}>{m.body}</span>}
              </div>
            ))}
            {chat?.status === 'closed' && (
              <div className="rounded-xl bg-white p-3 text-center text-xs">
                This chat has ended. How did we do?
                <div className="mt-1 flex justify-center gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-label={`${n} stars`} onClick={() => post({ action: 'rate', id: chat.id, rating: n })}><Star size={18} className="text-amber" /></button>)}</div>
                <button onClick={restart} className="mt-2 underline">Start a new chat</button>
              </div>
            )}
            <div ref={end} />
          </div>
          <form onSubmit={submit} className="space-y-2 border-t border-line p-3">
            {!chat && (
              <div className="grid gap-2">
                <select className="field !py-2" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
                {!signedIn && <div className="grid grid-cols-2 gap-2"><input className="field !py-2" placeholder="Your name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} /><input className="field !py-2" placeholder="Email or phone" value={guest.contact} onChange={(e) => setGuest({ ...guest, contact: e.target.value })} /></div>}
              </div>
            )}
            <div className="flex gap-2">
              <input className="field !py-2" placeholder={hours?.open ? 'Type your message' : 'Leave a message'} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
              <button className="btn-primary !px-3" disabled={busy || !text.trim()} aria-label="Send"><Send size={16} /></button>
            </div>
          </form>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="ml-auto flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white shadow-xl hover:brightness-95" aria-expanded={open}>
        <MessageCircle size={18} /> Live chat <span className={`size-2 rounded-full ${hours?.open ? 'bg-emerald-300' : 'bg-white/50'}`} />
      </button>
    </div>
  );
}
