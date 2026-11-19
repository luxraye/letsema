'use client';
import { useState } from 'react';
import { Phone, Delete, X } from 'lucide-react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

/** A feature phone that talks to the same /api/ussd endpoint a mobile network gateway would call. */
export function UssdPhone() {
  const [input, setInput] = useState('');
  const [screen, setScreen] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask(steps: string[]) {
    setBusy(true);
    try {
      const res = await fetch('/api/ussd', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: steps.join('*') }) });
      const body = await res.text();
      setScreen(body.replace(/^(CON|END) /, ''));
      setOpen(body.startsWith('CON'));
      setSession(body.startsWith('CON') ? steps : []);
    } catch { setScreen('Network error. Try again.'); setOpen(false); }
    setBusy(false); setInput('');
  }

  function send() {
    if (busy) return;
    if (open) return ask([...session, input]);
    if (input.replace(/\s/g, '') === '*161#') return ask([]);
    setScreen(input ? `${input}\nUnknown code. Dial *161#.` : 'Dial *161# to start.');
  }

  function reset() { setScreen(null); setOpen(false); setSession([]); setInput(''); }

  return (
    <div className="mx-auto w-72 rounded-[2.5rem] border-[10px] border-ink bg-ink p-3 shadow-2xl">
      <div className="flex h-60 flex-col rounded-2xl bg-[#c9d8b6] p-3 font-mono text-[13px] leading-snug text-[#1d2a14]" aria-live="polite">
        {screen ? <pre className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono">{screen}</pre> : <div className="flex-1 text-center text-xs opacity-70">CEDA<br />No data needed</div>}
        <div className="mt-2 min-h-6 border-t border-[#1d2a14]/30 pt-1 text-lg tracking-widest">{input || (open ? <span className="text-xs opacity-60">Type a reply</span> : '')}</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={reset} aria-label="End" className="grid h-10 place-items-center rounded-xl bg-rose-600 text-white"><X size={18} /></button>
        <button type="button" onClick={() => setInput((s) => s.slice(0, -1))} aria-label="Delete" className="grid h-10 place-items-center rounded-xl bg-white/10 text-white"><Delete size={18} /></button>
        <button type="button" onClick={send} disabled={busy} aria-label={open ? 'Send' : 'Call'} className="grid h-10 place-items-center rounded-xl bg-emerald-600 text-white disabled:opacity-50"><Phone size={18} /></button>
        {KEYS.map((k) => <button key={k} type="button" onClick={() => setInput((s) => (s + k).slice(0, 20))} className="h-11 rounded-xl bg-white/10 text-lg font-bold text-white transition hover:bg-white/20">{k}</button>)}
      </div>
      <input aria-label="Type with your keyboard" value={input} onChange={(e) => setInput(e.target.value.slice(0, 20))} onKeyDown={(e) => e.key === 'Enter' && send()} className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40" placeholder="Or type here, then Enter" />
    </div>
  );
}
