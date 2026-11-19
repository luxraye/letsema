import { useState } from 'react';
import { Palette, Clock, Plug, Check } from 'lucide-react';
import { useMe, useStore, PageHeader, Section, Button, Field, attempt, Badge } from '../../ui/kit';
import { setChatHours, setTheme, toggleWebhook } from '../../core/actions';
import type { Theme } from '../../core/types';

const PRESETS: Theme[] = [
  { preset: 'letsema', primary: '#0b6b5c', accent: '#e8a33d', ink: '#11201c', paper: '#f6f4ee', font: 'Plus Jakarta Sans Variable', radius: 14 },
  { preset: 'ceda-sunrise', primary: '#d94914', accent: '#f8a018', ink: '#3a2a24', paper: '#fbf7f2', font: 'Poppins', radius: 12 },
  { preset: 'kalahari-night', primary: '#1f4e79', accent: '#f2c14e', ink: '#0f1b2a', paper: '#f3f5f8', font: 'Inter Variable', radius: 10 },
  { preset: 'okavango', primary: '#2f6f3e', accent: '#5aa9e6', ink: '#14231a', paper: '#f4f7f2', font: 'Plus Jakarta Sans Variable', radius: 18 },
];
const FONTS = ['Plus Jakarta Sans Variable', 'Inter Variable', 'Poppins', 'Montserrat', 'Source Sans 3', 'system-ui'];

function loadFont(font: string) {
  if (font.includes('Variable') || font === 'system-ui') return;
  const id = `gf-${font.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  l.id = id; l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(l);
}

export default function AdminSettings() {
  const me = useMe()!;
  const s = useStore();
  const [th, setTh] = useState<Theme>(s.settings.theme);
  const [chat, setChat] = useState(s.settings.chat);
  loadFont(th.font);
  const apply = (t: Theme) => { setTh(t); loadFont(t.font); attempt(() => setTheme(me, t), 'Look updated for everyone'); };
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Look & settings" sub="CEDA can direct the layout’s colours, fonts and shape here, without a developer. Changes apply instantly to every page and every user." />
      <div className="space-y-5">
        <Section title={<span className="flex items-center gap-2"><Palette size={18} /> Brand and theme</span>}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRESETS.map((p) => (
              <button key={p.preset} onClick={() => apply(p)} className={`rounded-2xl border p-3 text-left transition ${th.preset === p.preset ? 'border-brand ring-2 ring-brand/30' : 'border-line hover:border-ink/30'}`} style={{ background: p.paper }}>
                <div className="flex gap-1.5"><span className="h-7 w-7 rounded-full" style={{ background: p.primary }} /><span className="h-7 w-7 rounded-full" style={{ background: p.accent }} /><span className="h-7 w-7 rounded-full" style={{ background: p.ink }} /></div>
                <div className="mt-2 text-sm font-bold capitalize" style={{ color: p.ink, fontFamily: p.font }}>{p.preset.replace('-', ' ')}</div>
                <div className="text-xs" style={{ color: p.ink, opacity: 0.6 }}>{p.font.replace(' Variable', '')}</div>
                {th.preset === p.preset && <Badge tone="brand" className="mt-1"><Check size={11} /> active</Badge>}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {(['primary', 'accent', 'ink', 'paper'] as const).map((k) => (
              <Field key={k} label={k === 'ink' ? 'Text' : k === 'paper' ? 'Background' : k[0]!.toUpperCase() + k.slice(1)} htmlFor={`c-${k}`}>
                <div className="flex items-center gap-2"><input id={`c-${k}`} type="color" className="h-10 w-12 cursor-pointer rounded-lg border border-line" value={th[k]} onChange={(e) => setTh({ ...th, [k]: e.target.value, preset: 'custom' })} /><code className="text-xs">{th[k]}</code></div>
              </Field>
            ))}
            <Field label="Heading font" htmlFor="font"><select id="font" className="field" value={th.font} onChange={(e) => setTh({ ...th, font: e.target.value, preset: 'custom' })}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select></Field>
            <Field label={`Corner roundness: ${th.radius}px`} htmlFor="rad"><input id="rad" type="range" min={0} max={24} value={th.radius} onChange={(e) => setTh({ ...th, radius: Number(e.target.value), preset: 'custom' })} className="w-full accent-[var(--brand)]" /></Field>
          </div>
          <Button className="mt-4" onClick={() => apply(th)}>Apply custom look</Button>
        </Section>

        <Section title={<span className="flex items-center gap-2"><Clock size={18} /> Live chat hours</span>} sub="Outside these hours, and on weekends and public holidays, visitors get the not-available message and can leave a message.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Opens" htmlFor="co"><input id="co" type="time" className="field" value={chat.open} onChange={(e) => setChat({ ...chat, open: e.target.value })} /></Field>
            <Field label="Closes" htmlFor="cc"><input id="cc" type="time" className="field" value={chat.close} onChange={(e) => setChat({ ...chat, close: e.target.value })} /></Field>
            <Field label="Chats per consultant" htmlFor="cm"><input id="cm" type="number" min={1} max={10} className="field" value={chat.maxPerAgent} onChange={(e) => setChat({ ...chat, maxPerAgent: Number(e.target.value) })} /></Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <label key={d} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${chat.days.includes(i) ? 'border-brand bg-brand-soft' : 'border-line'}`}><input type="checkbox" className="sr-only" checked={chat.days.includes(i)} onChange={(e) => setChat({ ...chat, days: e.target.checked ? [...chat.days, i].sort() : chat.days.filter((x) => x !== i) })} />{d}</label>
          ))}</div>
          <Button className="mt-4" onClick={() => attempt(() => setChatHours(me, chat), 'Chat hours saved')}>Save chat hours</Button>
        </Section>

        <Section title={<span className="flex items-center gap-2"><Plug size={18} /> Integrations</span>} sub="Letsema is API-first, so CEDA systems (CRM, loan management, BI) can plug in without changing the portal.">
          <div className="space-y-2">{s.settings.webhooks.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 text-sm"><code className="flex-1 truncate">{w.url}</code><span className="text-muted">{w.events.join(', ')}</span><Button size="sm" variant={w.active ? 'primary' : 'secondary'} onClick={() => attempt(() => toggleWebhook(me, w.id), w.active ? 'Webhook disabled' : 'Webhook enabled')}>{w.active ? 'Enabled' : 'Disabled'}</Button></div>
          ))}</div>
          <div className="mt-4 rounded-xl bg-ink p-4 font-mono text-xs leading-relaxed text-paper">
            <div className="mb-2 font-sans text-sm font-bold">REST API (production)</div>
            GET  /api/v1/calls · GET /api/v1/calls/:id<br />
            POST /api/v1/ideas · GET /api/v1/ideas/:ref/status<br />
            GET  /api/v1/reports/participation?from=&amp;to=<br />
            Webhooks: idea.submitted, idea.status_changed, idea.awarded, milestone.verified<br />
            Auth: OAuth 2.0 client credentials, scoped per system; HMAC-signed webhooks
          </div>
        </Section>
      </div>
    </div>
  );
}
