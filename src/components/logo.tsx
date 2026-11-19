export function Logo({ dark = false, label = 'CEDA' }: { dark?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold tracking-tight">
      <svg viewBox="0 0 40 24" width="34" height="20" aria-hidden>
        <path d="M4 22a16 16 0 0 1 32 0" fill="none" stroke="var(--color-amber)" strokeWidth="4" strokeLinecap="round" />
        <path d="M10 22a10 10 0 0 1 20 0" fill="none" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="20" cy="22" r="3.5" fill="#c0262d" />
      </svg>
      <span className={dark ? 'text-white' : 'text-ink'}>{label}</span>
    </span>
  );
}
