/** Portal mark: a seed opening into a spark. Follows the current look's colours. */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id="mark-g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="var(--t-brand-2)" /><stop offset=".55" stopColor="var(--t-brand)" /><stop offset="1" stopColor="var(--t-bark)" /></linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#mark-g)" />
      <path d="M16 25c-4.6-2.4-7-6-7-10.2C9 11 12 8 16 7c4 1 7 4 7 7.8C23 19 20.6 22.6 16 25Z" fill="#fff" fillOpacity=".18" />
      <path d="M16 23V12.5M16 12.5c0-2.6 1.9-4.3 4.4-4.5-.1 2.6-1.9 4.4-4.4 4.5Zm0 3.2c0-2.3-1.7-3.9-3.9-4 .1 2.3 1.7 3.9 3.9 4Z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="23.5" cy="8.5" r="1.6" fill="var(--t-accent)" />
    </svg>
  );
}

export function Logo({ dark = false, sub = false, label = 'CEDA' }: { dark?: boolean; sub?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className={`font-display block text-[18px] font-bold tracking-[0.04em] ${dark ? 'text-white' : 'text-fg'}`}>{label}</span>
        {sub && <span className={`mt-1 block text-[9px] font-medium uppercase tracking-[0.2em] ${dark ? 'text-white/60' : 'text-muted'}`}>Innovation Portal</span>}
      </span>
    </span>
  );
}
