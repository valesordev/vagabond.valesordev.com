"use client";

import type { Stop } from "@/lib/mock/vagabond-data";

export function StopInfoCard({ stop }: { stop: Stop }) {
  if (stop.kind !== "workstop") {
    return (
      <div className="map-info">
        <div className="micro">{stop.kind}</div>
        <h3 style={{ margin: "4px 0 6px", fontFamily: "var(--font-display)", fontSize: 18 }}>{stop.name}</h3>
        <div style={{ fontSize: 12.5, color: "var(--color-text-soft)" }}>{stop.loc}</div>
        {stop.arrival && (
          <div className="mono" style={{ fontSize: 12, marginTop: 8 }}>
            ETA {stop.arrival} &middot; OUT {stop.departure}
          </div>
        )}
      </div>
    );
  }

  const meetings = stop.meetings ?? [];

  return (
    <div className="map-info">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="micro">
          Work stop &middot; Day {stop.day}
        </div>
        {stop.feasible === "warn" ? (
          <span className="pill warn">
            <span className="dot" />
            Tight buffer
          </span>
        ) : (
          <span className="pill ok">
            <span className="dot" />
            Feasible
          </span>
        )}
      </div>
      <h3 style={{ margin: "4px 0 4px", fontFamily: "var(--font-display)", fontSize: 18 }}>{stop.name}</h3>
      <div style={{ fontSize: 12.5, color: "var(--color-text-soft)", marginBottom: 10 }}>{stop.loc}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
        <div>
          <div className="micro" style={{ marginBottom: 2 }}>
            Arrival
          </div>
          <div className="mono">{stop.arrival}</div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>
            {stop.arrivalLocal} home
          </div>
        </div>
        <div>
          <div className="micro" style={{ marginBottom: 2 }}>
            Departure
          </div>
          <div className="mono">{stop.departure}</div>
        </div>
      </div>

      <div className="divider" />

      <div className="micro" style={{ marginBottom: 6 }}>
        Meetings &middot; {meetings.length}
      </div>
      {meetings.map((m) => (
        <div
          key={m.id}
          style={{
            fontSize: 12,
            marginBottom: 4,
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {m.title}
          </span>
          <span className="mono" style={{ color: "var(--color-text-soft)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {m.homeTime} &middot; {m.duration}m
          </span>
        </div>
      ))}

      {stop.fallback && (
        <>
          <div className="divider" />
          <div className="micro" style={{ marginBottom: 4, color: "var(--color-secondary)" }}>
            Fallback
          </div>
          <div style={{ fontSize: 12.5 }}>
            <b>{stop.fallback.name}</b> &middot;{" "}
            <span style={{ color: "var(--color-text-soft)" }}>{stop.fallback.note}</span>
          </div>
        </>
      )}

      {stop.feasibleReason && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            background: "#c98a3b14",
            borderRadius: 6,
            fontSize: 12,
            color: "#7d5419",
            borderLeft: "2px solid var(--warn)",
          }}
        >
          {stop.feasibleReason}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <button type="button" className="btn-sm ghost">
          Edit timing
        </button>
        <button type="button" className="btn-sm ghost">
          Choose fallback
        </button>
      </div>
    </div>
  );
}
