"use client";

import { getVagabondMockData, type Stop, type TripDay } from "@/lib/mock/vagabond-data";

type ItineraryRow = { type: "day"; day: TripDay } | { type: "stop"; stop: Stop };

export function ItineraryTable({
  stops,
  selectedId,
  setSelected,
}: {
  stops: Stop[];
  selectedId: string;
  setSelected: (id: string) => void;
}) {
  const D = getVagabondMockData();
  const rows: ItineraryRow[] = [];
  D.days.forEach((day) => {
    rows.push({ type: "day", day });
    stops
      .filter(
        (s) =>
          s.day === day.num ||
          (day.num === 1 && s.kind === "origin") ||
          (day.num === 3 && s.kind === "destination"),
      )
      .forEach((s) => rows.push({ type: "stop", stop: s }));
  });

  return (
    <table className="itin-table">
      <thead>
        <tr>
          <th style={{ width: 28 }}></th>
          <th>Stop</th>
          <th>Type</th>
          <th>Arrive</th>
          <th>Depart</th>
          <th>Local TZ</th>
          <th>Slack</th>
          <th>Conn.</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          if (r.type === "day") {
            return (
              <tr key={`d-${r.day.num}`} className="day-row">
                <td colSpan={8}>
                  Day {r.day.num} &middot; {r.day.date} &middot; {r.day.title} &middot;{" "}
                  <span className="itin-mono">
                    {r.day.miles} mi &middot; {r.day.hours}h
                  </span>
                </td>
              </tr>
            );
          }
          const s = r.stop;
          const tz = s.arrival ? s.arrival.split(" ")[1] || "—" : "—";
          return (
            <tr
              key={s.id}
              className={s.id === selectedId ? "selected" : ""}
              onClick={() => setSelected(s.id)}
              style={{ cursor: "pointer" }}
            >
              <td>
                <span
                  className={`stop-marker ${s.kind === "workstop" ? "work" : s.kind === "camp" ? "camp" : "waypoint"}`}
                  style={{ width: 18, height: 18, fontSize: 9 }}
                >
                  {s.kind === "workstop"
                    ? "W"
                    : s.kind === "camp"
                      ? "C"
                      : s.kind === "origin"
                        ? "A"
                        : s.kind === "destination"
                          ? "Z"
                          : "·"}
                </span>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="itin-mono" style={{ fontSize: 11 }}>
                  {s.loc}
                </div>
              </td>
              <td>
                <span className="micro">{s.kind.replace("workstop", "work stop")}</span>
              </td>
              <td className="itin-mono">{s.arrival || "—"}</td>
              <td className="itin-mono">{s.departure || "—"}</td>
              <td className="itin-mono">{tz}</td>
              <td>
                {s.feasible === "warn" && (
                  <span className="pill warn">
                    <span className="dot" />+{s.preBufferMargin}m
                  </span>
                )}
                {s.feasible === "ok" && (
                  <span className="pill ok">
                    <span className="dot" />+{s.preBufferMargin}m
                  </span>
                )}
                {!s.feasible && (
                  <span className="micro" style={{ color: "var(--color-text-faint)" }}>
                    &mdash;
                  </span>
                )}
              </td>
              <td>
                {s.connectivity ? (
                  <span className="mono" style={{ fontSize: 11 }}>
                    <span className={`conn-icon ${s.connectivity}`} /> {s.connectivity}
                  </span>
                ) : (
                  <span className="itin-mono">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
