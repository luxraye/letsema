import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ChatWidget } from '@/components/chat-widget';
import { Ambient } from '@/components/ambient';
import { currentUser } from '@/lib/session';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative isolate pt-[4.5rem]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem] [mask-image:linear-gradient(#000_55%,transparent)]"><Ambient silk={false} sparks={false} /></div>
        {children}
      </main>
      <SiteFooter />
      <ChatWidget signedIn={!!me} />
    </>
  );
}
