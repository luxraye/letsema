import { useState } from 'react';
import { BadgeCheck, XCircle } from 'lucide-react';
import { useStore, Button, PageHeader } from '../../ui/kit';
import { receipt } from '../../core/actions';
import { fmtDate, pula } from '../../core/util';

export default function Verify() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<null | { ok: boolean; text: string }>(null);
  const check = () => {
    const v = q.trim().toLowerCase();
    for (const i of s.ideas) {
      if (i.award && i.award.code.toLowerCase() === v) return setResult({ ok: true, text: `Genuine award: ${i.ref} “${i.title}”, ${i.award.amount ? pula(i.award.amount) : 'recognition'}, confirmed ${fmtDate(i.award.at)}.` });
      if (i.versions.length && receipt(i).fingerprint === v) return setResult({ ok: true, text: `Genuine receipt: ${i.ref}, version ${receipt(i).version}, submitted ${fmtDate(receipt(i).at)}.` });
    }
    setResult({ ok: false, text: 'No receipt or award matches. Check you copied the whole code.' });
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader eyebrow="Verification" title="Check a receipt or award" sub="Paste a receipt fingerprint or an award code to confirm it was issued by this portal and has not been altered." />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); check(); }}>
        <input className="field font-mono" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Receipt fingerprint or award code" aria-label="Code" />
        <Button type="submit">Check</Button>
      </form>
      {result && (
        <div className={`rise mt-6 flex gap-3 rounded-2xl p-5 ${result.ok ? 'bg-emerald-50 text-emerald-950' : 'bg-rose-50 text-rose-950'}`}>
          {result.ok ? <BadgeCheck className="shrink-0" /> : <XCircle className="shrink-0" />}<p>{result.text}</p>
        </div>
      )}
      <p className="mt-6 text-sm text-muted">Try award code <button className="font-mono underline" onClick={() => setQ(s.ideas.find((i) => i.award)?.award?.code ?? '')}>{s.ideas.find((i) => i.award)?.award?.code}</button>.</p>
    </div>
  );
}
