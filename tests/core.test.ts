import { describe, expect, it } from 'vitest';
import { weightedTotal, calibrate, leaderboard, spread, DISAGREE } from '@/lib/scoring';
import { canonical, sha256 } from '@/lib/crypto';
import { wordDiff } from '@/lib/diff';
import { toCsv } from '@/lib/csv';
import { sniff } from '@/lib/files';
import { chatStatus, addWorkingHours, local } from '@/lib/hours';
import { can, GRANTS } from '@/lib/rbac';
import { HACKATHON_RUBRIC, STANDARD_RUBRIC } from '@/lib/catalogue';
import { pula } from '@/lib/instances';

// Botswana is UTC+2, so 09:00 local is 07:00Z.
const bw = (iso: string) => new Date(`${iso}+02:00`);

describe('scoring', () => {
  it('rubrics add up to 100', () => {
    expect(HACKATHON_RUBRIC.reduce((s, c) => s + c.weight, 0)).toBe(100);
    expect(STANDARD_RUBRIC.reduce((s, c) => s + c.weight, 0)).toBe(100);
  });
  it('weights 0–10 scores into a total out of 100', () => {
    const all10 = Object.fromEntries(HACKATHON_RUBRIC.map((c) => [c.key, 10]));
    expect(weightedTotal(HACKATHON_RUBRIC, all10)).toBe(100);
    expect(weightedTotal(HACKATHON_RUBRIC, {})).toBe(0);
  });
  it('calibration lifts a harsh marker towards the panel', () => {
    const evs = [
      ...['a', 'b', 'c'].map((e, i) => ({ entryId: e, evaluatorId: 'harsh', total: 40 + i * 5 })),
      ...['a', 'b', 'c'].map((e, i) => ({ entryId: e, evaluatorId: 'soft', total: 75 + i * 5 })),
    ];
    const out = calibrate(evs);
    const harshA = out.find((x) => x.evaluatorId === 'harsh' && x.entryId === 'a')!;
    const softA = out.find((x) => x.evaluatorId === 'soft' && x.entryId === 'a')!;
    expect(harshA.calibrated).toBeCloseTo(softA.calibrated, 5);
  });
  it('flags disagreement over 20 points', () => {
    expect(spread([50, 75])).toBeGreaterThan(DISAGREE);
    expect(spread([60])).toBe(0);
  });
  it('leaderboard is reproducible and breaks ties by earliest submission', () => {
    const rows = [
      { entryId: '1', ref: 'X-2', title: 'B', submittedAt: new Date('2026-11-10'), totals: [80] },
      { entryId: '2', ref: 'X-1', title: 'A', submittedAt: new Date('2026-11-09'), totals: [80] },
      { entryId: '3', ref: 'X-3', title: 'C', submittedAt: new Date('2026-11-08'), totals: [] },
    ];
    const a = leaderboard(rows); const b = leaderboard([...rows].reverse());
    expect(a.standings.map((s) => s.ref)).toEqual(['X-1', 'X-2']);
    expect(a.hash).toBe(b.hash);
  });
});

describe('integrity', () => {
  it('canonical JSON ignores key order', () => {
    expect(sha256(canonical({ a: 1, b: { c: 2, d: 3 } }))).toBe(sha256(canonical({ b: { d: 3, c: 2 }, a: 1 })));
  });
  it('word diff marks added and removed words', () => {
    const d = wordDiff('cost is high', 'cost is P200 per unit');
    expect(d.some((p) => p.t === 'del' && p.s.includes('high'))).toBe(true);
    expect(d.some((p) => p.t === 'add' && p.s.includes('P200'))).toBe(true);
  });
  it('CSV export neutralises spreadsheet formulas', () => {
    const csv = toCsv([{ title: '=HYPERLINK("http://x")', n: 1 }]);
    expect(csv.split('\n')[1].startsWith(`"'=`)).toBe(true);
  });
  it('detects a file’s real type from its bytes', () => {
    expect(sniff(Buffer.from('%PDF-1.7\n'))).toBe('pdf');
    expect(sniff(Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]))).toBe('exe');
    expect(sniff(Buffer.from('plain words'))).toBe('text');
  });
});

describe('working hours', () => {
  it('chat is open on a weekday morning, closed at night, weekends and holidays', () => {
    expect(chatStatus(bw('2026-11-19T10:00:00')).open).toBe(true);
    expect(chatStatus(bw('2026-11-19T16:30:00')).open).toBe(false);
    expect(chatStatus(bw('2026-11-21T10:00:00')).open).toBe(false);
    expect(chatStatus(bw('2026-09-30T10:00:00')).reason).toMatch(/Botswana Day/);
  });
  it('working-hour SLA clocks skip nights and weekends', () => {
    const fri4pm = bw('2026-11-20T16:00:00');
    const due = addWorkingHours(fri4pm, 2);
    expect(local(due).date).toBe('2026-11-23');
    expect(local(due).hour).toBe(9);
  });
});

describe('roles', () => {
  it('admins run the process but cannot score or vote', () => {
    expect(can('admin', 'entry.screen')).toBe(true);
    expect(can('admin', 'entry.review')).toBe(false);
    expect(can('admin', 'entry.decide')).toBe(false);
  });
  it('observers are read-only', () => {
    expect(GRANTS.observer.every((p) => ['entry.viewAll', 'reports.view'].includes(p))).toBe(true);
  });
  it('nobody signed out can do anything', () => {
    expect(can(null, 'entry.create')).toBe(false);
  });
});

it('formats pula', () => { expect(pula(40000)).toBe('P40,000'); expect(pula(null)).toBe('–'); });
