"use client";

import { getVagabondMockData, type CatalogLocation } from "@/lib/mock/vagabond-data";
import { TYPE_META } from "./catalog-primitives";

export function CatalogMap({
  locations,
  selectedId,
  setSelected,
}: {
  locations: CatalogLocation[];
  selectedId: string;
  setSelected: (id: string) => void;
}) {
  const D = getVagabondMockData();
  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <pattern id="paper-grain-2" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="var(--map-bg)" />
          <circle cx="20" cy="40" r="0.6" fill="#c8a884" opacity="0.18" />
          <circle cx="85" cy="20" r="0.5" fill="#c8a884" opacity="0.14" />
          <circle cx="60" cy="95" r="0.7" fill="#c8a884" opacity="0.16" />
        </pattern>
      </defs>
      <rect width="1200" height="640" fill="url(#paper-grain-2)" />

      <g stroke="var(--map-state)" strokeWidth="1.2" fill="none" opacity="0.85" strokeDasharray="2 3">
        <polyline
          points={[
            [-114.6, 38],
            [-114.6, 32.5],
          ]
            .map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`)
            .join(" ")}
        />
        <polyline
          points={[
            [-109.05, 37],
            [-109.05, 31.3],
          ]
            .map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`)
            .join(" ")}
        />
        <polyline
          points={[
            [-103.05, 36.5],
            [-103.05, 32],
            [-106.6, 32],
          ]
            .map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`)
            .join(" ")}
        />
        <polyline
          points={[
            [-94, 33.5],
            [-94, 29.5],
          ]
            .map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`)
            .join(" ")}
        />
        <polyline
          points={[
            [-85, 35],
            [-85, 30.5],
          ]
            .map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`)
            .join(" ")}
        />
      </g>

      <g stroke="var(--map-road)" strokeWidth="1" fill="none" opacity="0.55">
        <polyline
          points={[
            [-120, 33.8],
            [-116, 34],
            [-112, 32.5],
            [-108, 32.3],
            [-104, 31],
            [-98, 30],
            [-92, 30.4],
            [-86, 30.5],
            [-82, 30.3],
          ]
            .map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`)
            .join(" ")}
        />
      </g>

      {locations.map((l) => {
        const p = D.project(l.coords[0], l.coords[1]);
        const m = TYPE_META[l.type];
        const isSelected = l.id === selectedId;
        return (
          <g key={l.id} style={{ cursor: "pointer" }} onClick={() => setSelected(l.id)}>
            {isSelected && (
              <circle cx={p.x} cy={p.y} r={14} fill="none" stroke={m.color} strokeWidth="1.5" opacity="0.4" />
            )}
            <circle cx={p.x} cy={p.y} r="7" fill={m.color} stroke="#fbf6ef" strokeWidth="2" />
            {isSelected && (
              <g>
                <rect
                  x={p.x + 12}
                  y={p.y - 14}
                  width={Math.max(120, l.name.length * 6)}
                  height="28"
                  rx="3"
                  fill="var(--color-bg)"
                  stroke={m.color}
                />
                <text
                  x={p.x + 18}
                  y={p.y - 2}
                  fontSize="11"
                  fontFamily="var(--font-sans)"
                  fontWeight="600"
                  fill="var(--color-text)"
                >
                  {l.name}
                </text>
                <text
                  x={p.x + 18}
                  y={p.y + 10}
                  fontSize="9.5"
                  fontFamily="var(--font-mono)"
                  fill="var(--color-text-soft)"
                >
                  {l.jurisdiction} · {l.visits} visits
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
