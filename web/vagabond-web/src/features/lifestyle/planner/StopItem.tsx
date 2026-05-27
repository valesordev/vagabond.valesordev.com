"use client";

import type { Stop } from "@/lib/mock/vagabond-data";

export function StopItem({
  stop,
  selected,
  onClick,
}: {
  stop: Stop;
  selected: boolean;
  onClick: () => void;
}) {
  const markerCls =
    stop.kind === "workstop"
      ? "work"
      : stop.kind === "camp"
        ? "camp"
        : stop.kind === "origin" || stop.kind === "destination"
          ? "camp"
          : "waypoint";
  const initial =
    stop.kind === "workstop"
      ? "W"
      : stop.kind === "camp"
        ? "C"
        : stop.kind === "origin"
          ? "A"
          : stop.kind === "destination"
            ? "Z"
            : "·";

  return (
    <div
      className={`stop-item ${selected ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={`stop-marker ${markerCls}`}>{initial}</div>
      <div className="stop-body">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div className="stop-name">{stop.name}</div>
          {stop.feasible === "warn" && (
            <span className="pill warn">
              <span className="dot" />
              Tight
            </span>
          )}
          {stop.feasible === "ok" && (
            <span className="pill ok">
              <span className="dot" />
              OK
            </span>
          )}
        </div>
        <div className="stop-loc">{stop.loc}</div>
        {stop.arrival && (
          <div className="stop-meta">
            <span>
              <b>ETA</b> {stop.arrival}
            </span>
            {stop.arrivalLocal && (
              <span style={{ color: "var(--color-text-faint)" }}>({stop.arrivalLocal} home)</span>
            )}
            {stop.departure && (
              <span>
                <b>OUT</b> {stop.departure}
              </span>
            )}
          </div>
        )}
        {stop.kind === "workstop" && stop.meetings && (
          <ul className="meet-list">
            {stop.meetings.map((m) => (
              <li className="meet" key={m.id}>
                <div>
                  <div className="meet-title">{m.title}</div>
                  <div className="meet-time">
                    <span className="home">{m.homeTime}</span> &middot; {m.localTime} local &middot; {m.duration}m
                  </div>
                </div>
                <div className="meet-conn">
                  <span className={`conn-icon ${m.connectivity}`} />{" "}
                  {m.connectivity === "starlink"
                    ? "Starlink"
                    : m.connectivity === "cellular"
                      ? "Cellular OK"
                      : "Any"}
                </div>
              </li>
            ))}
          </ul>
        )}
        {stop.kind === "workstop" && stop.preBufferMargin != null && stop.postBufferMargin != null && (
          <div className="feasibility">
            <div className={`feas-card ${stop.preBufferMargin >= 15 ? "ok" : "warn"}`}>
              <div className="label">Pre-buffer slack</div>
              <div className="value">+{stop.preBufferMargin} min</div>
            </div>
            <div className={`feas-card ${stop.postBufferMargin >= 15 ? "ok" : "warn"}`}>
              <div className="label">Post-buffer slack</div>
              <div className="value">+{stop.postBufferMargin} min</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
