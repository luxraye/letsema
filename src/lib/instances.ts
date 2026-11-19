import type { InstanceDefinition, Stage } from '@/db/schema';
import { canonical, sha256 } from './crypto';

export const rulesHash = (d: InstanceDefinition) => sha256(canonical(d));

export function currentStage(d: InstanceDefinition, now = new Date()): { stage: Stage | null; index: number; state: 'before' | 'during' | 'after' } {
  const t = now.toISOString().slice(0, 10);
  const i = d.stages.findIndex((s) => s.starts <= t && t <= s.ends);
  if (i >= 0) return { stage: d.stages[i], index: i, state: 'during' };
  if (d.stages.length && t < d.stages[0].starts) return { stage: d.stages[0], index: 0, state: 'before' };
  const next = d.stages.findIndex((s) => s.starts > t);
  if (next > 0) return { stage: d.stages[next], index: next, state: 'before' };
  return { stage: d.stages.at(-1) ?? null, index: d.stages.length - 1, state: 'after' };
}

/** Plain-language list of what changed between two rule sets, recorded with every new version. */
export function describeChanges(a: InstanceDefinition, b: InstanceDefinition): string[] {
  const out: string[] = [];
  const byKey = <T extends { key: string }>(xs: T[]) => new Map(xs.map((x) => [x.key, x]));
  const ra = byKey(a.rubric); const rb = byKey(b.rubric);
  for (const [k, c] of rb) {
    const o = ra.get(k);
    if (!o) out.push(`Added scoring criterion "${c.label}" (${c.weight}%)`);
    else if (o.weight !== c.weight) out.push(`"${c.label}" weight ${o.weight}% → ${c.weight}%`);
    else if (o.label !== c.label || o.guide !== c.guide) out.push(`Reworded criterion "${c.label}"`);
  }
  for (const [k, o] of ra) if (!rb.has(k)) out.push(`Removed scoring criterion "${o.label}"`);
  const fa = byKey(a.form); const fb = byKey(b.form);
  for (const [k, f] of fb) {
    const o = fa.get(k);
    if (!o) out.push(`Added form question "${f.label}"`);
    else if (canonical(o) !== canonical(f)) out.push(`Changed form question "${f.label}"`);
  }
  for (const [k, o] of fa) if (!fb.has(k)) out.push(`Removed form question "${o.label}"`);
  const sa = byKey(a.stages); const sb = byKey(b.stages);
  for (const [k, s] of sb) {
    const o = sa.get(k);
    if (!o) out.push(`Added stage "${s.label}"`);
    else if (o.starts !== s.starts || o.ends !== s.ends) out.push(`"${s.label}" dates ${o.starts}–${o.ends} → ${s.starts}–${s.ends}`);
  }
  for (const [k, o] of sa) if (!sb.has(k)) out.push(`Removed stage "${o.label}"`);
  if (canonical(a.eligibility) !== canonical(b.eligibility)) out.push('Changed eligibility rules');
  if (canonical(a.team) !== canonical(b.team)) out.push(`Team size ${a.team.min}–${a.team.max} → ${b.team.min}–${b.team.max}`);
  if (a.reviewersPerEntry !== b.reviewersPerEntry) out.push(`Evaluators per entry ${a.reviewersPerEntry} → ${b.reviewersPerEntry}`);
  if (a.shortlistSize !== b.shortlistSize) out.push(`Shortlist size ${a.shortlistSize} → ${b.shortlistSize}`);
  if (canonical(a.prizes) !== canonical(b.prizes)) out.push('Changed prizes');
  if (a.audience !== b.audience) out.push(`Audience ${a.audience} → ${b.audience}`);
  return out;
}

export function validateDefinition(d: InstanceDefinition): string[] {
  const errs: string[] = [];
  const w = d.rubric.reduce((s, c) => s + c.weight, 0);
  if (!d.rubric.length) errs.push('Add at least one scoring criterion.');
  if (w !== 100) errs.push(`Scoring weights must add up to 100% (now ${w}%).`);
  if (!d.form.length) errs.push('Add at least one form question.');
  if (!d.stages.length) errs.push('Add at least one stage.');
  for (const s of d.stages) if (s.starts > s.ends) errs.push(`Stage "${s.label}" ends before it starts.`);
  if (d.team.min < 1 || d.team.max < d.team.min) errs.push('Team size is not valid.');
  if (d.reviewersPerEntry < 1) errs.push('Each entry needs at least one evaluator.');
  const keys = new Set<string>();
  for (const f of d.form) { if (keys.has(f.key)) errs.push(`Two questions share the key "${f.key}".`); keys.add(f.key); }
  return errs;
}

export const pula = (n: number | null | undefined) => n == null ? '–' : `P${Math.round(n).toLocaleString('en-US')}`;
export const prizePool = (d: InstanceDefinition) => d.prizes.reduce((s, p) => s + p.amount, 0);
