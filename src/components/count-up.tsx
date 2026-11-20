'use client';
import { useEffect, useRef, useState } from 'react';

/** Shows the real number at once, then counts up to it when it scrolls into view (skipped for reduced motion). */
export function CountUp({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), d = 1300;
      const step = (t: number) => { const p = Math.min(1, (t - t0) / d); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
      setN(0); requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref} className="tabular-nums">{prefix}{n.toLocaleString('en-US')}{suffix}</span>;
}
