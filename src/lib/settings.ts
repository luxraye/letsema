import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { db, schema } from '@/db';

export type Theme = { preset: string; primary: string; accent: string; font: string; radius: number };
/** The built-in look: Burgundy by default, with an Azure switch for every visitor. Other presets override the colours. */
export const DEFAULT_THEME: Theme = { preset: 'letsema', primary: '#d0295f', accent: '#f3c46e', font: 'Inter', radius: 18 };
export const PRESETS: Record<string, Theme> = {
  letsema: DEFAULT_THEME,
  ceda: { preset: 'ceda', primary: '#d94914', accent: '#f8a018', font: 'Poppins', radius: 16 },
  kalahari: { preset: 'kalahari', primary: '#9a4a1c', accent: '#e0b15a', font: 'Poppins', radius: 12 },
  delta: { preset: 'delta', primary: '#0f766e', accent: '#f59e0b', font: 'Nunito', radius: 20 },
  pula: { preset: 'pula', primary: '#1d4ed8', accent: '#38bdf8', font: 'Inter', radius: 10 },
  'high-contrast': { preset: 'high-contrast', primary: '#000000', accent: '#ffd400', font: 'Atkinson Hyperlegible', radius: 6 },
};
export const FONTS = ['Inter', 'Outfit', 'Poppins', 'Nunito', 'Montserrat', 'Lato', 'Atkinson Hyperlegible'];

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const [r] = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
    return (r?.value as T) ?? fallback;
  } catch { return fallback; }
}
export const getTheme = cache(() => getSetting<Theme>('theme', DEFAULT_THEME));
/** True when the admin picked a preset or their own colours, which then override both looks. */
export const usesBuiltInLook = (t: Theme) => t.preset === 'letsema';
