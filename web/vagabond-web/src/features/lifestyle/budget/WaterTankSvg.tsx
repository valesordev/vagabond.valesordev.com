"use client";

export function WaterTankSvg({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, (used / total) * 100);
  const remainPct = 100 - pct;
  return (
    <svg viewBox="0 0 240 90" style={{ width: "100%", height: 90 }}>
      <rect x="6" y="14" width="228" height="64" rx="6" fill="var(--color-bg-lift)" stroke="var(--color-line)" />
      <rect x="6" y="14" width={228 * (remainPct / 100)} height="64" rx="6" fill="#cfd9c8" stroke="none" />
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line
            x1={6 + 228 * (t / 100)}
            y1="10"
            x2={6 + 228 * (t / 100)}
            y2="18"
            stroke="var(--color-text-soft)"
            strokeWidth="0.7"
          />
          <text
            x={6 + 228 * (t / 100)}
            y="7"
            fontFamily="var(--font-mono)"
            fontSize="8"
            fill="var(--color-text-soft)"
            textAnchor="middle"
          >
            {Math.round(total * (t / 100))}
          </text>
        </g>
      ))}
      <g transform={`translate(${6 + 228 * 0.4} 46)`}>
        <line x1="0" y1="-32" x2="0" y2="32" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="-30" y="34" width="60" height="14" rx="3" fill="var(--color-primary)" />
        <text x="0" y="44" fontFamily="var(--font-mono)" fontSize="9" fill="#fff" textAnchor="middle">
          RESUPPLY
        </text>
      </g>
      <text
        x="120"
        y="50"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="600"
        fill="var(--color-text)"
        textAnchor="middle"
      >
        {used.toFixed(1)} / {total} gal
      </text>
    </svg>
  );
}
