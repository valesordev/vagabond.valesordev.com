"use client";

import type { CatalogLocationType } from "@/lib/mock/vagabond-data";

export const TYPE_META: Record<CatalogLocationType, { label: string; color: string }> = {
  campsite: { label: "Campsite", color: "#80a08c" },
  trailhead: { label: "Trailhead", color: "#c47a51" },
  water: { label: "Water", color: "#7faab3" },
  poi: { label: "POI", color: "#b8975f" },
  hazard: { label: "Hazard", color: "#b34b3a" },
  workspot: { label: "Work spot", color: "#a86241" },
};

export function TypeChip({ type }: { type: CatalogLocationType }) {
  const m = TYPE_META[type] ?? { label: type, color: "var(--color-text-faint)" };
  return (
    <span className="loc-type-chip">
      <span className="sw" style={{ background: m.color }} /> {m.label}
    </span>
  );
}

export function Signal({ bars }: { bars: number }) {
  return (
    <span className="signal" title={`${bars}/5 cellular`}>
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= bars ? "on" : ""} />
      ))}
    </span>
  );
}
