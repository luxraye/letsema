export type Part = { t: 'same' | 'add' | 'del'; s: string };
/** Word-level diff (longest common subsequence), so reviewers see exactly what changed on resubmission. */
export function wordDiff(a: string, b: string): Part[] {
  const x = a.split(/(\s+)/).filter(Boolean); const y = b.split(/(\s+)/).filter(Boolean);
  if (x.length * y.length > 400_000) return [{ t: 'del', s: a }, { t: 'add', s: b }];
  const dp = Array.from({ length: x.length + 1 }, () => new Uint32Array(y.length + 1));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Part[] = []; let i = 0, j = 0;
  const push = (t: Part['t'], s: string) => { const l = out.at(-1); if (l && l.t === t) l.s += s; else out.push({ t, s }); };
  while (i < x.length && j < y.length) { if (x[i] === y[j]) { push('same', x[i]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) push('del', x[i++]); else push('add', y[j++]); }
  while (i < x.length) push('del', x[i++]); while (j < y.length) push('add', y[j++]);
  return out;
}
