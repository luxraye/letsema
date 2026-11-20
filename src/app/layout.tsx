import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import '@fontsource-variable/inter';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import './globals.css';
import { getTheme, usesBuiltInLook } from '@/lib/settings';
import { A11yBoot } from '@/components/a11y';
import { Spotlight } from '@/components/theme';
import { LOOK_COOKIE } from '@/lib/look';

export const metadata: Metadata = {
  title: { default: 'CEDA Innovation Portal', template: '%s · CEDA Innovation Portal' },
  description: 'Enter CEDA innovation challenges online, see how you are judged, and follow your application at every step.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
};

export async function generateViewport(): Promise<Viewport> {
  const look = (await cookies()).get(LOOK_COOKIE)?.value === 'azure' ? 'azure' : 'burgundy';
  return { themeColor: look === 'azure' ? '#05295c' : '#150510', width: 'device-width', initialScale: 1 };
}

const BUILT_IN_FONTS = ['Inter', 'Outfit'];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [t, jar] = await Promise.all([getTheme(), cookies()]);
  const look = jar.get(LOOK_COOKIE)?.value === 'azure' ? 'azure' : 'burgundy';
  const googleFont = !BUILT_IN_FONTS.includes(t.font) ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.font)}:wght@400;600;700;800&display=swap` : null;
  // Admin overrides from Settings: colours only when they left the built-in look; font and corners always.
  const colours = usesBuiltInLook(t) ? '' : `--t-brand:${t.primary};--t-accent:${t.accent};`;
  const font = t.font && t.font !== 'Inter' ? `--font-body:'${t.font}',ui-sans-serif,system-ui,sans-serif;` : '';
  return (
    <html lang="en" data-theme={look} suppressHydrationWarning>
      <head>
        {googleFont && <link rel="stylesheet" href={googleFont} />}
        <style>{`:root,[data-theme]{${colours}${font}--radius:${t.radius}px}`}</style>
        <A11yBoot />
      </head>
      <body className="min-h-dvh font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
        <Spotlight />
        {children}
      </body>
    </html>
  );
}
