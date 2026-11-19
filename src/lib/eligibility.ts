import type { InstanceDefinition } from '@/db/schema';

export type EligibilityAnswers = { age?: number; citizen?: boolean; youthShare?: number; cipa?: boolean; staff?: boolean };
export type Verdict = { ok: boolean; reasons: { ok: boolean; text: string }[] };

export function checkEligibility(d: InstanceDefinition, a: EligibilityAnswers): Verdict {
  const e = d.eligibility; const reasons: Verdict['reasons'] = [];
  if (d.audience === 'staff') reasons.push({ ok: !!a.staff, text: 'Open to CEDA staff only' });
  if (e.citizenOnly) reasons.push({ ok: !!a.citizen, text: 'Botswana citizens only' });
  if (e.minAge || e.maxAge) {
    const ok = a.age != null && (!e.minAge || a.age >= e.minAge) && (!e.maxAge || a.age <= e.maxAge);
    reasons.push({ ok, text: `Aged ${e.minAge ?? 0} to ${e.maxAge ?? 120}` });
  }
  if (e.cipaRequired) reasons.push({ ok: !!a.cipa, text: 'Business registered with CIPA' });
  if (e.minYouthShare) reasons.push({ ok: (a.youthShare ?? 0) > e.minYouthShare, text: `More than ${e.minYouthShare}% owned by citizen youth` });
  return { ok: reasons.every((r) => r.ok), reasons };
}

export function ageFrom(dob?: string | null, now = new Date()) {
  if (!dob) return undefined;
  const d = new Date(dob); let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}
