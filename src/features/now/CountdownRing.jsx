import React from 'react';

/**
 * Circular countdown. `fraction` is the share of time still left (1 → full ring,
 * 0 → empty). Purely decorative: the banner title carries the same information
 * in text, so the ring is hidden from assistive tech.
 */
export default function CountdownRing({ fraction, value, unit, size = 56, urgent = false }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.min(1, Math.max(0, fraction));

  return (
    <div
      aria-hidden="true"
      data-testid="countdown-ring"
      data-fraction={f.toFixed(3)}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          className={`transition-[stroke-dashoffset] duration-1000 ease-linear ${
            urgent ? 'text-amber-200' : 'text-white'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-base font-bold tabular-nums">{value}</span>
        <span className="text-[9px] uppercase tracking-wide opacity-80 mt-0.5">{unit}</span>
      </div>
    </div>
  );
}
