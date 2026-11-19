import type { Campaign, Idea, Review, State } from './types';
import { mean, stdev } from './util';

/** Weighted score out of 100 for one review. Each criterion is scored 1–5. */
export function reviewTotal(review: Review, campaign: Campaign): number {
  const total = campaign.criteria.reduce((a, c) => a + c.weight, 0) || 1;
  const s = campaign.criteria.reduce((a, c) => a + ((review.scores[c.id] ?? 0) / 5) * c.weight, 0);
  return Math.round((s / total) * 1000) / 10;
}

export interface ReviewerStats {
  reviewerId: string;
  n: number;
  mean: number;
  sd: number;
}

/** How lenient or strict each reviewer is, across every review they have written. */
export function reviewerStats(state: State): Map<string, ReviewerStats> {
  const byReviewer = new Map<string, number[]>();
  for (const idea of state.ideas) {
    const c = state.campaigns.find((x) => x.id === idea.campaignId);
    if (!c) continue;
    for (const r of idea.reviews) {
      const arr = byReviewer.get(r.reviewerId) ?? [];
      arr.push(reviewTotal(r, c));
      byReviewer.set(r.reviewerId, arr);
    }
  }
  const out = new Map<string, ReviewerStats>();
  for (const [id, xs] of byReviewer) out.set(id, { reviewerId: id, n: xs.length, mean: mean(xs), sd: stdev(xs) });
  return out;
}

export function globalStats(state: State) {
  const all: number[] = [];
  for (const idea of state.ideas) {
    const c = state.campaigns.find((x) => x.id === idea.campaignId);
    if (c) for (const r of idea.reviews) all.push(reviewTotal(r, c));
  }
  return { mean: mean(all), sd: stdev(all) || 1 };
}

/**
 * Calibrated score: removes each reviewer's personal leniency/strictness
 * (z-score against their own history, re-projected onto the panel-wide scale).
 * Reviewers with fewer than 3 reviews are left un-adjusted.
 */
export function calibrate(raw: number, rs: ReviewerStats | undefined, g: { mean: number; sd: number }): number {
  if (!rs || rs.n < 3 || rs.sd < 1) return raw;
  const z = (raw - rs.mean) / rs.sd;
  return Math.max(0, Math.min(100, Math.round((g.mean + z * g.sd) * 10) / 10));
}

export interface IdeaScore {
  raw: number | null;
  calibrated: number | null;
  spread: number;
  disagreement: boolean;
  count: number;
  perCriterion: Record<string, number>;
  recommendations: Record<string, number>;
}

export function ideaScore(state: State, idea: Idea, stats = reviewerStats(state), g = globalStats(state)): IdeaScore {
  const c = state.campaigns.find((x) => x.id === idea.campaignId)!;
  const reviews = idea.reviews.filter((r) => r.round === idea.round);
  const use = reviews.length ? reviews : idea.reviews;
  if (!use.length || !c) return { raw: null, calibrated: null, spread: 0, disagreement: false, count: 0, perCriterion: {}, recommendations: {} };
  const totals = use.map((r) => reviewTotal(r, c));
  const cal = use.map((r, i) => calibrate(totals[i]!, stats.get(r.reviewerId), g));
  const per: Record<string, number> = {};
  for (const cr of c.criteria) per[cr.id] = Math.round(mean(use.map((r) => r.scores[cr.id] ?? 0)) * 10) / 10;
  const recs: Record<string, number> = {};
  for (const r of use) recs[r.recommendation] = (recs[r.recommendation] ?? 0) + 1;
  const spread = totals.length > 1 ? Math.max(...totals) - Math.min(...totals) : 0;
  return {
    raw: Math.round(mean(totals) * 10) / 10,
    calibrated: Math.round(mean(cal) * 10) / 10,
    spread: Math.round(spread * 10) / 10,
    disagreement: spread >= c.levels.disagreementThreshold,
    count: use.length,
    perCriterion: per,
    recommendations: recs,
  };
}
