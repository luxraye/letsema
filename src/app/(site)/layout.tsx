import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ChatWidget } from '@/components/chat-widget';
import { currentUser } from '@/lib/session';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <ChatWidget signedIn={!!me} />
    </>
  );
}
