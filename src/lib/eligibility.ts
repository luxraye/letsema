import type { BusinessStage, InstanceDefinition } from '@/db/schema';

/** Each competition (Instance) carries its own entry rules. Nothing here is about being a portal user. */
export type EligibilityAnswers = { age?: number; citizen?: boolean; youthShare?: number; cipa?: boolean; staff?: boolean; womenOwned?: boolean; stage?: BusinessStage; sector?: string };
export type Reason = { ok: boolean; text: string; unknown?: boolean };
export type Verdict = { ok: boolean; reasons: Reason[] };

export const STAGE_LABEL: Record<BusinessStage, string> = { idea: 'An idea, not trading yet', startup: 'Trading for under 3 years', growth: 'Trading for 3 years or more' };
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs.at(-1)}`);

export function checkEligibility(d: InstanceDefinition, a: EligibilityAnswers): Verdict {
  const e = d.eligibility; const reasons: Reason[] = [];
  const add = (known: boolean, ok: boolean, text: string) => reasons.push({ ok: known && ok, text, unknown: !known || undefined });
  if (d.audience === 'staff') add(a.staff != null, !!a.staff, 'Open to CEDA staff only');
  if (e.citizenOnly) add(a.citizen != null, !!a.citizen, 'Botswana citizens only');
  if (e.minAge || e.maxAge) add(a.age != null, a.age != null && (!e.minAge || a.age >= e.minAge) && (!e.maxAge || a.age <= e.maxAge), e.maxAge ? `Aged ${e.minAge ?? 0} to ${e.maxAge}` : `Aged ${e.minAge} or over`);
  if (e.cipaRequired) add(a.cipa != null, !!a.cipa, 'Business registered with CIPA');
  if (e.minYouthShare) add(a.youthShare != null, (a.youthShare ?? 0) > e.minYouthShare, `More than ${e.minYouthShare}% owned by citizens aged 18 to 35`);
  if (e.womenLed) add(a.womenOwned != null, !!a.womenOwned, 'At least 51% owned by women');
  if (e.businessStages?.length) add(a.stage != null, !!a.stage && e.businessStages.includes(a.stage), `Business stage: ${list(e.businessStages.map((s) => STAGE_LABEL[s].toLowerCase()))}`);
  if (e.sectorRequired && d.sectors.length) add(a.sector != null, !!a.sector && d.sectors.includes(a.sector), `Works in ${list(d.sectors)}`);
  return { ok: reasons.every((r) => r.ok), reasons };
}

/** Plain-language list of a competition's entry rules, for cards and summaries. */
export function ruleSummary(d: InstanceDefinition): string[] {
  return checkEligibility(d, {}).reasons.map((r) => r.text);
}

export function ageFrom(dob?: string | null, now = new Date()) {
  if (!dob) return undefined;
  const d = new Date(dob); let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}
