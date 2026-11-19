// Live-chat availability: 09:00–16:00, working days only (brief, Functionality 2).
// Botswana public holidays for 2026 are listed so holidays count as non-working days.
export const HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-01-02': 'New Year Holiday',
  '2026-04-03': 'Good Friday',
  '2026-04-04': 'Holy Saturday',
  '2026-04-06': 'Easter Monday',
  '2026-05-01': 'Labour Day',
  '2026-05-14': 'Ascension Day',
  '2026-07-01': 'Sir Seretse Khama Day',
  '2026-07-20': "President's Day",
  '2026-07-21': "President's Day Holiday",
  '2026-09-30': 'Botswana Day',
  '2026-10-01': 'Botswana Day Holiday',
  '2026-12-25': 'Christmas Day',
  '2026-12-26': 'Boxing Day',
};

export interface Availability {
  open: boolean;
  reason: 'open' | 'after_hours' | 'before_hours' | 'weekend' | 'holiday';
  message: string;
  local: string;
}

/** Gaborone time (CAT, UTC+2, no daylight saving). */
export function gaboroneParts(d: Date) {
  const t = new Date(d.getTime() + 2 * 3600_000);
  return {
    ymd: t.toISOString().slice(0, 10),
    day: t.getUTCDay(),
    minutes: t.getUTCHours() * 60 + t.getUTCMinutes(),
    hhmm: t.toISOString().slice(11, 16),
  };
}

export function availability(d: Date, cfg: { open: string; close: string; days: number[] }): Availability {
  const p = gaboroneParts(d);
  const [oh, om] = cfg.open.split(':').map(Number);
  const [ch, cm] = cfg.close.split(':').map(Number);
  const o = oh! * 60 + om!, c = ch! * 60 + cm!;
  const local = `${p.hhmm} in Gaborone`;
  const hol = HOLIDAYS_2026[p.ymd];
  const msg = (why: string) =>
    `Our consultants are not available at the moment (${why}). Live chat runs ${cfg.open}–${cfg.close} on working days. Leave a message and we will reply by email or SMS on the next working day.`;
  if (hol) return { open: false, reason: 'holiday', message: msg(`public holiday: ${hol}`), local };
  if (!cfg.days.includes(p.day)) return { open: false, reason: 'weekend', message: msg('weekend'), local };
  if (p.minutes < o) return { open: false, reason: 'before_hours', message: msg('before opening'), local };
  if (p.minutes >= c) return { open: false, reason: 'after_hours', message: msg('after hours'), local };
  return { open: true, reason: 'open', message: 'A CEDA consultant will join shortly.', local };
}
