import { z } from 'zod';
import type { InstanceDefinition } from '@/db/schema';
import { validateDefinition } from '@/lib/definition-rules';

/**
 * "Instance as code": the JSON document IT staff can paste or edit instead of using the visual editor.
 * The same checks run in the browser (live, as they type) and on the server (before anything is saved),
 * so a bad document can never reach applicants. Innovators never see this.
 */
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use a date like 2026-12-01');
const key = z.string().regex(/^[a-z0-9_]{1,40}$/, 'use lowercase letters, digits and _ only');

const Field = z.object({
  key, label: z.string().min(2), help: z.string().optional(),
  type: z.enum(['text', 'textarea', 'number', 'select', 'file', 'url']),
  required: z.boolean().optional(), options: z.array(z.string().min(1)).optional(),
  maxWords: z.number().int().positive().optional(), accept: z.array(z.string().regex(/^[a-z0-9]{2,5}$/, 'use a file extension like pdf')).optional(),
  maxMb: z.number().positive().max(50).optional(), maxPages: z.number().int().positive().optional(),
}).strict().refine((f) => f.type !== 'select' || (f.options?.length ?? 0) >= 2, { message: 'a select question needs at least 2 options', path: ['options'] });

export const DefinitionSchema = z.object({
  kind: z.enum(['hackathon', 'call', 'ideas', 'accelerator']),
  audience: z.enum(['public', 'staff']),
  stages: z.array(z.object({ key, label: z.string().min(2), starts: date, ends: date, note: z.string().optional() }).strict()).min(1),
  form: z.array(Field).min(1),
  rubric: z.array(z.object({ key, label: z.string().min(2), weight: z.number().int().min(0).max(100), guide: z.string() }).strict()).min(1),
  eligibility: z.object({
    minAge: z.number().int().min(16).max(99).optional(), maxAge: z.number().int().min(16).max(120).optional(),
    citizenOnly: z.boolean().optional(), minYouthShare: z.number().min(0).max(100).optional(), cipaRequired: z.boolean().optional(),
    womenLed: z.boolean().optional(), businessStages: z.array(z.enum(['idea', 'startup', 'growth'])).optional(), sectorRequired: z.boolean().optional(),
  }).strict(),
  team: z.object({ min: z.number().int().min(1), max: z.number().int().min(1).max(50) }).strict(),
  reviewersPerEntry: z.number().int().min(1).max(10),
  shortlistSize: z.number().int().min(1).max(500),
  prizes: z.array(z.object({ place: z.string().min(1), amount: z.number().min(0) }).strict()),
  sectors: z.array(z.string()),
}).strict();

export const InstanceDocSchema = z.object({
  name: z.string().min(5, 'at least 5 characters').max(120),
  tagline: z.string().max(200).default(''),
  description: z.string().max(5000).default(''),
  photo: z.string().regex(/^\/photos\/[a-z0-9-]+\.webp$/, 'use one of the portal photos, like /photos/lab-drone.webp').or(z.literal('')).default(''),
  definition: DefinitionSchema,
}).strict();

export type InstanceDoc = { name: string; tagline: string; description: string; photo: string; definition: InstanceDefinition };

/** Pretty JSON for the code editor. */
export const toCode = (doc: InstanceDoc) => JSON.stringify(doc, null, 2);

/** Where in the text a JSON syntax error sits, as "line X, column Y". */
function where(text: string, msg: string) {
  const m = /position (\d+)/.exec(msg);
  if (!m) return '';
  const before = text.slice(0, Number(m[1])).split('\n');
  return ` (line ${before.length}, column ${before.at(-1)!.length + 1})`;
}

/** Parse and check a pasted document. Returns either the clean document or plain-language errors with their location. */
export function parseInstanceCode(text: string): { doc?: InstanceDoc; errors: string[] } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { errors: [`This is not valid JSON${where(text, msg)}: ${msg.replace(/^.*?:\s*/, '').replace(/ in JSON at position \d+.*$/, '')}`] };
  }
  const r = InstanceDocSchema.safeParse(raw);
  if (!r.success) {
    return { errors: r.error.issues.slice(0, 12).map((i) => `${i.path.length ? i.path.join('.') : 'document'}: ${i.message}`) };
  }
  const doc = r.data as InstanceDoc;
  const rules = validateDefinition(doc.definition);
  return rules.length ? { errors: rules } : { doc, errors: [] };
}
