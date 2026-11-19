import type { Criterion } from '@/db/schema';
import { canonical, sha256 } from './crypto';

/** Each criterion is scored 0 to 10; the total is a weighted score out of 100. */
export function weightedTotal(rubric: Criterion[], scores: Record<string, number>) {
  return Math.round(rubric.reduce((s, c) => s + ((scores[c.key] ?? 0) / 10) * c.weight, 0) * 10) / 10;
}

export const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
export const stdev = (xs: number[]) => { if (xs.length < 2) return 0; const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };

type Ev = { entryId: string; evaluatorId: string; total: number };

/**
 * Reviewer calibration: some evaluators mark hard, some soft. We rescale each evaluator's
 * totals to the panel's overall mean and spread (z-score), so an idea is not punished
 * for drawing a harsh marker. Needs at least 3 scores from an evaluator, otherwise raw.
 */
export function calibrate(evals: Ev[]) {
  const all = evals.map((e) => e.total);
  const gm = mean(all); const gs = stdev(all) || 1;
  const by = new Map<string, number[]>();
  for (const e of evals) by.set(e.evaluatorId, [...(by.get(e.evaluatorId) ?? []), e.total]);
  const stats = new Map([...by].map(([k, xs]) => [k, { m: mean(xs), s: stdev(xs), n: xs.length }]));
  return evals.map((e) => {
    const st = stats.get(e.evaluatorId)!;
    const adj = st.n >= 3 && st.s > 0 ? gm + ((e.total - st.m) / st.s) * gs : e.total;
    return { ...e, calibrated: Math.max(0, Math.min(100, Math.round(adj * 10) / 10)) };
  });
}

export function evaluatorBias(evals: Ev[]) {
  const gm = mean(evals.map((e) => e.total));
  const by = new Map<string, number[]>();
  for (const e of evals) by.set(e.evaluatorId, [...(by.get(e.evaluatorId) ?? []), e.total]);
  return [...by].map(([evaluatorId, xs]) => ({ evaluatorId, n: xs.length, mean: Math.round(mean(xs) * 10) / 10, bias: Math.round((mean(xs) - gm) * 10) / 10 }));
}

/** Flag entries where evaluators disagree by more than 20 points, so the panel discusses them. */
export const DISAGREE = 20;
export function spread(totals: number[]) { return totals.length < 2 ? 0 : Math.max(...totals) - Math.min(...totals); }

export type Standing = { entryId: string; ref: string; title: string; score: number; n: number; spread: number; rank: number };

/** Reproducible leaderboard: same scores in, same order and same hash out. Ties break by earliest submission. */
export function leaderboard(rows: { entryId: string; ref: string; title: string; submittedAt: Date | null; totals: number[] }[]) {
  const scored = rows.filter((r) => r.totals.length).map((r) => ({ ...r, score: Math.round(mean(r.totals) * 10) / 10 }));
  scored.sort((a, b) => b.score - a.score || (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0) || a.ref.localeCompare(b.ref));
  const standings: Standing[] = scored.map((r, i) => ({ entryId: r.entryId, ref: r.ref, title: r.title, score: r.score, n: r.totals.length, spread: spread(r.totals), rank: i + 1 }));
  const hash = sha256(canonical(standings.map((s) => [s.ref, s.score, s.rank])));
  return { standings, hash };
}
