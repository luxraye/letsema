'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/** Real-time updates: polls a tiny "what changed" stamp and refreshes the page when it moves. */
export function Live({ every = 4000 }: { every?: number }) {
  const router = useRouter(); const last = useRef<string | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      const r = await fetch('/api/live', { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
      if (!alive || !r) return;
      if (last.current && r.stamp !== last.current) router.refresh();
      last.current = r.stamp;
    };
    tick(); const t = setInterval(tick, every);
    return () => { alive = false; clearInterval(t); };
  }, [router, every]);
  return null;
}
