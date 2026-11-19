import { addWorkingHours } from './hours';

export const SLA = {
  P1: { label: 'Critical: portal down or data at risk', respond: 1, resolve: 4, clock: '24/7' },
  P2: { label: 'High: a key step is blocked (cannot submit, cannot sign in)', respond: 2, resolve: 8, clock: '24/7' },
  P3: { label: 'Normal: something works badly but there is a way around it', respond: 8, resolve: 24, clock: 'working' },
  P4: { label: 'Question or request for a change', respond: 16, resolve: 40, clock: 'working' },
} as const;
export type Severity = keyof typeof SLA;

export function slaTargets(sev: Severity, from = new Date()) {
  const s = SLA[sev];
  if (s.clock === '24/7') return { respondBy: new Date(from.getTime() + s.respond * 3600_000), resolveBy: new Date(from.getTime() + s.resolve * 3600_000) };
  return { respondBy: addWorkingHours(from, s.respond), resolveBy: addWorkingHours(from, s.resolve) };
}
