import { describe, expect, it } from 'vitest';
import { sha256 } from '../../src/core/sha256';
import { availability } from '../../src/core/hours';
import { calibrate, reviewTotal } from '../../src/core/scoring';
import { similar } from '../../src/core/similarity';
import { createSeed } from '../../src/core/seed';
import { TRANSITIONS } from '../../src/core/workflow';
import { can, DEFAULT_ROLES } from '../../src/core/rbac';
import { toCsv } from '../../src/core/util';

describe('sha256', () => {
  it('matches the FIPS 180-4 test vectors', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });
});

describe('chat hours (Gaborone, UTC+2)', () => {
  const cfg = { open: '09:00', close: '16:00', days: [1, 2, 3, 4, 5] };
  it('is open on a working weekday at 10:00 CAT', () => expect(availability(new Date('2026-11-19T08:00:00Z'), cfg).open).toBe(true));
  it('is closed at 16:00 CAT', () => expect(availability(new Date('2026-11-19T14:00:00Z'), cfg).reason).toBe('after_hours'));
  it('is closed before 09:00 CAT', () => expect(availability(new Date('2026-11-19T06:30:00Z'), cfg).reason).toBe('before_hours'));
  it('is closed on Saturday', () => expect(availability(new Date('2026-11-21T09:00:00Z'), cfg).reason).toBe('weekend'));
  it('is closed on Botswana Day', () => expect(availability(new Date('2026-09-30T09:00:00Z'), cfg).reason).toBe('holiday'));
  it('says the agent is not available', () => expect(availability(new Date('2026-11-21T09:00:00Z'), cfg).message).toMatch(/not available/));
});

describe('scoring', () => {
  const s = createSeed();
  const c = s.campaigns[0]!;
  it('scores all-5s as 100 and all-1s as 20', () => {
    const all = (v: number) => Object.fromEntries(c.criteria.map((k) => [k.id, v]));
    const base = { id: 'x', reviewerId: 'r', round: 1, comments: {}, overall: '', recommendation: 'advance' as const, submittedAt: '' };
    expect(reviewTotal({ ...base, scores: all(5) }, c)).toBe(100);
    expect(reviewTotal({ ...base, scores: all(1) }, c)).toBe(20);
  });
  it('lifts a strict reviewer and lowers a generous one', () => {
    const g = { mean: 65, sd: 10 };
    expect(calibrate(60, { reviewerId: 'strict', n: 5, mean: 50, sd: 10 }, g)).toBe(75);
    expect(calibrate(80, { reviewerId: 'kind', n: 5, mean: 85, sd: 10 }, g)).toBe(60);
  });
  it('leaves reviewers with too little history unadjusted', () => {
    expect(calibrate(70, { reviewerId: 'new', n: 2, mean: 40, sd: 10 }, { mean: 65, sd: 10 })).toBe(70);
  });
});

describe('similar ideas', () => {
  it('finds the closest idea first', () => {
    const docs = [
      { item: 'a', text: 'Solar cold rooms for informal vegetable traders at bus ranks' },
      { item: 'b', text: 'Payroll and payslips for micro employers' },
      { item: 'c', text: 'Tyre recycling into rubber pavers' },
    ];
    const r = similar('Solar powered cold storage for vegetable traders', docs, 3, 0.05);
    expect(r[0]!.item).toBe('a');
  });
});

describe('workflow and permissions', () => {
  it('cannot jump from submitted straight to awarded', () => expect(TRANSITIONS.submitted).not.toContain('awarded'));
  it('keeps reviewers blind and observers read-only', () => {
    const s = createSeed();
    const reviewer = s.users.find((u) => u.role === 'reviewer')!;
    const observer = s.users.find((u) => u.role === 'observer')!;
    expect(can(s, reviewer, 'idea.view.identity')).toBe(false);
    expect(can(s, observer, 'idea.decide')).toBe(false);
    expect(DEFAULT_ROLES.find((r) => r.key === 'observer')!.permissions.every((p) => p.startsWith('idea.view') || p === 'reports.view')).toBe(true);
  });
  it('separates administration from judging', () => {
    const s = createSeed();
    const admin = s.users.find((u) => u.role === 'admin')!;
    expect(can(s, admin, 'review.submit')).toBe(false);
    expect(can(s, admin, 'idea.decide')).toBe(false);
  });
});

describe('CSV export', () => {
  it('neutralises spreadsheet formulas', () => expect(toCsv([{ a: '=HYPERLINK("x")' }])).toContain("'=HYPERLINK"));
});
