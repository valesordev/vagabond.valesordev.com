"use client";

import type { Stop } from "@/lib/mock/vagabond-data";

export function ScheduleBlock({
  ws,
  selected,
  onClick,
}: {
  ws: Stop;
  selected: boolean;
  onClick: () => void;
}) {
  const meetings = ws.meetings ?? [];

  return (
    <div
      onClick={onClick}
      style={{
        padding: 14,
        borderLeft: `3px solid ${ws.feasible === "warn" ? "var(--warn)" : "var(--color-secondary)"}`,
        background: selected ? "#e1b07e2a" : "var(--color-bg-lift)",
        borderRadius: 4,
        marginBottom: 10,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ws.name}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
          Day {ws.day}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--color-text-soft)", marginTop: 2, marginBottom: 8 }}>
        {ws.loc.split(" \u2014 ")[0]}
      </div>
      {meetings.map((m) => (
        <div
          key={m.id}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 8,
            padding: "4px 0",
            borderTop: "1px dashed var(--color-line)",
            fontSize: 12,
          }}
        >
          <span className="mono" style={{ color: "var(--color-text-soft)" }}>
            {m.homeTime}
          </span>
          <span>{m.title}</span>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-soft)" }}>
            {m.duration}m
          </span>
        </div>
      ))}
    </div>
  );
}
