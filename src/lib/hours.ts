/** Live chat is staffed 09:00 to 16:00 Botswana time (UTC+2), Monday to Friday, except public holidays. */
export const CHAT_HOURS = { open: 9, close: 16, days: [1, 2, 3, 4, 5] };

export const HOLIDAYS: Record<string, string> = {
  '2026-01-01': "New Year's Day", '2026-01-02': 'Public holiday',
  '2026-04-03': 'Good Friday', '2026-04-04': 'Holy Saturday', '2026-04-06': 'Easter Monday',
  '2026-05-01': 'Labour Day', '2026-05-14': 'Ascension Day',
  '2026-07-01': 'Sir Seretse Khama Day', '2026-07-20': "President's Day", '2026-07-21': 'Public holiday',
  '2026-09-30': 'Botswana Day', '2026-10-01': 'Public holiday',
  '2026-12-25': 'Christmas Day', '2026-12-26': 'Boxing Day', '2026-12-28': 'Public holiday',
};

/** Botswana local time parts, independent of the server's time zone. */
export function local(d = new Date()) {
  const t = new Date(d.getTime() + 2 * 3600_000);
  return { date: t.toISOString().slice(0, 10), day: t.getUTCDay(), hour: t.getUTCHours() + t.getUTCMinutes() / 60 };
}

export function chatStatus(d = new Date()): { open: boolean; reason: string } {
  const { date, day, hour } = local(d);
  if (HOLIDAYS[date]) return { open: false, reason: `Closed for ${HOLIDAYS[date]}` };
  if (!CHAT_HOURS.days.includes(day)) return { open: false, reason: 'Closed at weekends' };
  if (hour < CHAT_HOURS.open) return { open: false, reason: 'Opens at 09:00' };
  if (hour >= CHAT_HOURS.close) return { open: false, reason: 'Closed after 16:00' };
  return { open: true, reason: 'Consultants online until 16:00' };
}

/** Add working hours (Mon to Fri, 08:00 to 17:00 Botswana time) for SLA targets. */
export function addWorkingHours(from: Date, hours: number) {
  let t = new Date(from); let left = hours * 60;
  while (left > 0) {
    t = new Date(t.getTime() + 60_000);
    const { date, day, hour } = local(t);
    if (day >= 1 && day <= 5 && !HOLIDAYS[date] && hour >= 8 && hour < 17) left--;
  }
  return t;
}
