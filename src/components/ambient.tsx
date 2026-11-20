/**
 * Moving background for the dark bands (hero, page tops, sign-in).
 * Burgundy: slow silk ribbons and rising gold sparks. Azure: drifting light and water ripples.
 * Pure CSS on transforms only, so it is cheap on low-end phones; it stops for reduced motion.
 */
const SPARKS = [6, 14, 23, 31, 42, 49, 57, 66, 74, 81, 88, 95];

export function Ambient({ silk = true, sparks = true, className = '' }: { silk?: boolean; sparks?: boolean; className?: string }) {
  return (
    <div aria-hidden className={`ambient ${className}`}>
      <span className="orb orb-1" /><span className="orb orb-2" /><span className="orb orb-3" />
      {silk && (
        <>
          <svg className="silk silk-1" viewBox="0 0 1600 400" preserveAspectRatio="none">
            <defs><linearGradient id="silk-g" x1="0" x2="1"><stop stopColor="var(--t-brand-2)" stopOpacity="0" /><stop offset=".5" stopColor="var(--t-brand-2)" stopOpacity=".5" /><stop offset="1" stopColor="var(--t-accent)" stopOpacity="0" /></linearGradient></defs>
            <path d="M0 220 C300 80 600 360 900 200 S1400 60 1600 180" stroke="url(#silk-g)" strokeWidth="90" fill="none" />
            <path d="M0 262 C320 140 620 380 920 240 S1400 120 1600 230" stroke="url(#silk-g)" strokeWidth="2" fill="none" />
          </svg>
          <svg className="silk silk-2" viewBox="0 0 1600 400" preserveAspectRatio="none">
            <path d="M0 160 C340 320 640 40 960 200 S1420 330 1600 140" stroke="url(#silk-g)" strokeWidth="140" fill="none" />
          </svg>
        </>
      )}
      {sparks && SPARKS.map((l, i) => <span key={l} className="spark" style={{ left: `${l}%`, animationDelay: `${(i * 0.83) % 10}s` }} />)}
      <span className="ripple" /><span className="ripple" style={{ animationDelay: '-2.3s' }} /><span className="ripple" style={{ animationDelay: '-4.6s' }} />
      <span className="grain" />
    </div>
  );
}
