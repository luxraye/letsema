import { Signal, Smartphone, Server } from 'lucide-react';
import { PageHeader, Notice } from '@/components/ui';
import { UssdPhone } from './ussd-phone';

export const metadata = { title: 'No data? Dial *161#' };

export default function Dial() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="No data needed" title="No data? Dial *161#" sub="Check where your application is, see which competitions are open, and find out when consultants are online, from any phone, without mobile data." />
      <div className="grid items-start gap-10 md:grid-cols-[18rem_1fr]">
        <UssdPhone />
        <div className="space-y-5">
          <Notice tone="amber"><b>Try it here.</b> Press <span className="mono">*161#</span> on the keypad, then the green button. Choose 1 and enter <span className="mono">0101</span> to track a demo application.</Notice>
          {[
            [Smartphone, 'What you can do', 'Track an application by its reference, list open competitions with closing dates, and check live chat hours. Replies use plain words and fit a small screen.'],
            [Server, 'How it connects', 'This simulator calls the same endpoint, /api/ussd, that a mobile network’s USSD gateway would call. It takes the standard session fields and answers with CON (menu continues) or END.'],
            [Signal, 'What CEDA would need', 'A short code agreed with the mobile networks. The code *161# shown here is a placeholder until CEDA chooses one.'],
          ].map(([Icon, h, p]) => { const I = Icon as typeof Signal; return (
            <div key={h as string} className="card flex gap-4 p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]"><I size={20} /></span><div><h2 className="font-bold">{h as string}</h2><p className="text-sm text-muted">{p as string}</p></div></div>
          ); })}
        </div>
      </div>
    </div>
  );
}
