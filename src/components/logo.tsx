/**
 * CEDA sunrise mark: three bands of a rising sun, red through amber to yellow.
 * Kept in CEDA's own colours in both looks so the brand is always recognisable.
 */
function band(R: number, r: number) {
  return `M${16 - R} 19A${R} ${R} 0 0 1 ${16 + R} 19L${16 + r} 19A${r} ${r} 0 0 0 ${16 - r} 19Z`;
}

export function LogoMark({ className = 'h-7 w-[45px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" aria-hidden className={`shrink-0 drop-shadow-[0_2px_10px_rgba(248,160,24,.35)] ${className}`}>
      <defs>
        <linearGradient id="sunrise-outer" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#a02010" /><stop offset=".55" stopColor="#f06020" /><stop offset="1" stopColor="#f8a018" />
        </linearGradient>
      </defs>
      <path d={band(15, 11.2)} fill="url(#sunrise-outer)" />
      <path d={band(10.2, 6.9)} fill="#f8a018" />
      <path d="M10 19A6 6 0 0 1 22 19Z" fill="#f8c808" />
    </svg>
  );
}

export function Logo({ dark = false, sub = false, label = 'CEDA', className = '' }: { dark?: boolean; sub?: boolean; label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="leading-none">
        <span className={`font-display block text-[20px] font-bold tracking-[0.06em] ${dark ? 'text-white' : 'text-fg'}`}>{label}</span>
        {sub && <span className={`mt-1 block text-[9px] font-medium uppercase tracking-[0.2em] ${dark ? 'text-white/60' : 'text-muted'}`}>Innovation Portal</span>}
      </span>
    </span>
  );
}
