/** CEDA sunrise mark: three bands of a rising sun, red through amber to yellow. */
function band(R: number, r: number) {
  return `M${16 - R} 19A${R} ${R} 0 0 1 ${16 + R} 19L${16 + r} 19A${r} ${r} 0 0 0 ${16 - r} 19Z`;
}

export function LogoMark({ className = 'h-6 w-[38px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" aria-hidden className={`shrink-0 ${className}`}>
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

export function Logo({ dark = false, sub = false, label = 'CEDA' }: { dark?: boolean; sub?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className={`block text-[17px] font-semibold tracking-[0.08em] ${dark ? 'text-white' : 'text-bark'}`}>{label}</span>
        {sub && <span className={`mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] ${dark ? 'text-white/60' : 'text-muted'}`}>Innovation Portal</span>}
      </span>
    </span>
  );
}
