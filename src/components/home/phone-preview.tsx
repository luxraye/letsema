'use client';
import { useState } from 'react';
import { Bell, Home, Megaphone, FileText, Inbox, ScanLine, Smartphone } from 'lucide-react';
import { LogoMark } from '@/components/logo';

type Idea = { title: string; instance: string; status: string; label: string; step: number };

/** A live phone mock-up (fixed light screen colours, so it reads the same in both looks) of the innovator dashboard, with a QR code on the back to open the portal on a real phone. */
export function PhonePreview({ name, ideas, qr, url }: { name: string; ideas: Idea[]; qr: string; url: string }) {
  const [back, setBack] = useState(false);
  const needs = ideas.filter((x) => x.status === 'returned');
  return (
    <div className="flex flex-col items-center">
      <div className="w-72 rounded-[2.8rem] border-[10px] border-[#14161f] bg-[#14161f] ring-1 ring-white/15 text-left shadow-2xl">
        <div className="relative flex h-[34rem] flex-col overflow-hidden rounded-[2.1rem] bg-[#f6f8fc] text-[#14161f]">
          <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-bold"><span>9:41</span><span className="h-5 w-20 rounded-full bg-[#14161f]" /><span>●●● ▮</span></div>
          {back ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <img src={qr} alt={`QR code that opens ${url}`} width={190} height={190} className="rounded-xl bg-white p-2 shadow" />
              <p className="text-sm font-bold">Scan to open the portal on your phone</p>
              <p className="break-all text-[11px] text-[#5b6476]">{url}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden px-4 pt-3">
              <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs font-bold"><LogoMark className="h-3 w-5" /> CEDA Ideas</span><span className="relative"><Bell size={16} />{needs.length > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-3.5 place-items-center rounded-full bg-[#e11d48] text-[8px] font-bold text-white">{needs.length}</span>}</span></div>
              <div className="mt-3 text-lg font-bold">Dumela, {name}</div>
              <div className="text-[11px] text-[#5b6476]">{needs.length ? `${needs.length} idea${needs.length > 1 ? 's need' : ' needs'} your attention` : 'Everything is up to date'}</div>
              {needs[0] && <div className="mt-3 rounded-xl border border-[#f6dca0] bg-[#fff8e8] p-3"><div className="text-[9px] font-bold uppercase text-[#8a4b08]">Changes requested</div><div className="text-xs font-bold">{needs[0].title}</div><div className="mt-2 inline-flex rounded-md bg-[#14161f] px-2 py-1 text-[10px] font-bold text-white">Open and resubmit</div></div>}
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#5b6476]">My ideas</div>
              <ul className="mt-1.5 space-y-2">{ideas.slice(0, 3).map((x) => (
                <li key={x.title} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2"><span className="text-xs font-bold leading-tight">{x.title}</span><span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${x.status === 'awarded' ? 'bg-[#d7f5e6] text-[#0b6b45]' : x.status === 'returned' ? 'bg-[#fdefc8] text-[#8a4b08]' : 'bg-[#dcecff] text-[#0b4d9c]'}`}>{x.label}</span></div>
                  <div className="truncate text-[10px] text-[#5b6476]">{x.instance}</div>
                  <div className="mt-2 grid grid-cols-5 gap-1">{[0, 1, 2, 3, 4].map((n) => <span key={n} className={`h-1 rounded-full ${n < x.step ? 'bg-[var(--brand)]' : 'bg-[#e3e7ef]'}`} />)}</div>
                </li>
              ))}</ul>
            </div>
          )}
          <div className="grid grid-cols-4 border-t border-[#e3e7ef] bg-white py-2 text-center text-[9px] text-[#5b6476]">{[[Home, 'Home'], [Megaphone, 'Calls'], [FileText, 'Ideas'], [Inbox, 'Inbox']].map(([I, l], n) => { const Icon = I as typeof Home; return <span key={l as string} className={n === 0 ? 'text-[var(--brand)]' : ''}><Icon size={15} className="mx-auto" />{l as string}</span>; })}</div>
        </div>
      </div>
      <button type="button" onClick={() => setBack((b) => !b)} className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm shadow-sm hover:border-stone-300">{back ? <Smartphone size={16} /> : <ScanLine size={16} />} {back ? 'Back to the app' : 'Flip for the QR code'}</button>
    </div>
  );
}
