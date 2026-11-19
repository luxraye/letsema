import type { Metadata, Viewport } from 'next';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import './globals.css';
import { getTheme } from '@/lib/settings';
import { A11yBoot } from '@/components/a11y';

export const metadata: Metadata = {
  title: { default: 'CEDA Innovation Portal', template: '%s · CEDA Innovation Portal' },
  description: 'Enter CEDA innovation challenges online, see how you are judged, and follow your application at every step.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { themeColor: '#2a1d18', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const t = await getTheme();
  const googleFont = t.font !== 'Poppins' ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.font)}:wght@400;600;700;800&display=swap` : null;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {googleFont && <link rel="stylesheet" href={googleFont} />}
        <style>{`:root{--brand:${t.primary};--accent:${t.accent};--radius:${t.radius}px;--color-brand:${t.primary};--color-amber:${t.accent};--font-sans:'${t.font}',ui-sans-serif,system-ui,sans-serif}`}</style>
        <A11yBoot />
      </head>
      <body className="min-h-dvh font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
