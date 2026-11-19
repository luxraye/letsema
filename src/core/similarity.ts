// Duplicate / related-idea detection with TF-IDF + cosine similarity.
// Runs locally (no external AI), so an innovator's draft never leaves the device.
const STOP = new Set(
  'a an and are as at be by for from has have in into is it its of on or our that the their this to we will with which who you your can using use more than through via across about not also into over per'.split(' '),
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ing|ers|er|es|s)$/, ''));
}

export function similar<T>(query: string, docs: { item: T; text: string }[], limit = 3, min = 0.12) {
  const q = tokens(query);
  if (q.length < 3) return [];
  const docTokens = docs.map((d) => tokens(d.text));
  const df = new Map<string, number>();
  for (const toks of docTokens) for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
  const N = docs.length + 1;
  const vec = (toks: string[]) => {
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    const v = new Map<string, number>();
    for (const [t, n] of tf) v.set(t, n * Math.log(N / (1 + (df.get(t) ?? 0))));
    return v;
  };
  const qv = vec(q);
  const qn = Math.sqrt([...qv.values()].reduce((a, x) => a + x * x, 0)) || 1;
  return docs
    .map((d, i) => {
      const dv = vec(docTokens[i]!);
      let dot = 0;
      for (const [t, w] of qv) dot += w * (dv.get(t) ?? 0);
      const dn = Math.sqrt([...dv.values()].reduce((a, x) => a + x * x, 0)) || 1;
      const shared = [...qv.keys()].filter((t) => dv.has(t)).slice(0, 5);
      return { item: d.item, score: dot / (qn * dn), shared };
    })
    .filter((r) => r.score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
