"use client";

import { useState } from "react";

export function ActualCard({
  label,
  value,
  unit,
  predicted,
  editable,
}: {
  label: string;
  value: number;
  unit: string;
  predicted: number;
  editable?: boolean;
}) {
  const [val, setVal] = useState(value);
  const delta = predicted ? ((val - predicted) / predicted) * 100 : 0;
  const showDelta = predicted > 0;
  return (
    <div className="actual-card">
      <span className="micro">{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        {editable ? (
          <input
            type="number"
            step="0.1"
            value={val}
            onChange={(e) => setVal(Number(e.target.value))}
            style={{
              width: 90,
              padding: "4px 6px",
              fontFamily: "var(--font-mono)",
              fontSize: 17,
              fontWeight: 600,
              border: "1px solid var(--color-line)",
              borderRadius: 3,
              background: "var(--color-bg)",
            }}
          />
        ) : (
          <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>
            {val}
          </span>
        )}
        <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
          {unit}
        </span>
      </div>
      {showDelta ? (
        <span className={`delta ${delta >= 0 ? "up" : "down"}`}>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}% vs. predicted
        </span>
      ) : (
        <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>
          no prediction
        </span>
      )}
    </div>
  );
}
