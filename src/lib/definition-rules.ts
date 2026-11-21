import type { InstanceDefinition } from '@/db/schema';

/** Business rules for a competition definition. No server imports, so the browser can run it too. */
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
