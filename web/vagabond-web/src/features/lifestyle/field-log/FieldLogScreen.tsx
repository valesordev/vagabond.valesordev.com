"use client";

import { useState } from "react";
import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { FactRow } from "../primitives";
import type { ConnectivityMode, LifestyleNavigateProps } from "../types";
import { ActualCard } from "./ActualCard";

export type FieldLogScreenProps = LifestyleNavigateProps & {
  connectivity?: ConnectivityMode;
};

export function FieldLogScreen({ connectivity = "online" }: FieldLogScreenProps = {}) {
  const D = getVagabondMockData();
  const [activeDay, setActiveDay] = useState(2);
  const logs = D.fieldLogs;
  const active = logs.find((l) => l.day === activeDay) || logs[1];

  const isOffline = connectivity === "offline";
  const isStarlink = connectivity === "starlink";

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <div className="topbar-crumb">Trip &middot; KELSO-26 &middot; In progress &middot; Day 2 of 3</div>
            <div className="topbar-title">Field log &mdash; {active.tripName}</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="pill ok">
            <span className="dot" />
            Live trip
          </span>
          {isOffline ? (
            <button type="button" className="btn-sm ghost" disabled>
              Queue locally
            </button>
          ) : (
            <button type="button" className="btn-sm sage">
              Save log
            </button>
          )}
        </div>
      </div>

      <div className="page page-narrow">
        <div className="log-day-tabs">
          {logs.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`log-day-tab ${l.day === activeDay ? "active" : ""} ${l.day === 2 ? "today" : ""}`}
              onClick={() => setActiveDay(l.day)}
            >
              <span className="when">
                Day {l.day} {l.day === 2 ? "· Today" : l.day < 2 ? "" : "· Future"}
              </span>
              <span>{l.date}</span>
            </button>
          ))}
        </div>

        <div className="log-grid">
          <section>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div className="micro">Log entry &middot; Day {active.day}</div>
                  <h2 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500 }}>
                    {active.date}
                  </h2>
                </div>
                <span className={`pill ${active.synced ? "ok" : "warn"}`}>
                  <span className="dot" />
                  {active.synced ? "Synced" : isOffline ? "Queued · 1 pending" : "Unsaved"}
                </span>
              </div>

              <div className="log-form-grid">
                <div className="log-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="k">Location</label>
                  <input type="text" defaultValue={active.location} />
                  <span className="hint">
                    Resolved from current rig coordinates &middot;{" "}
                    <span style={{ color: "var(--color-secondary)", cursor: "pointer" }}>pick from catalog</span>
                  </span>
                </div>

                <div className="log-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="k">Weather</label>
                  <input type="text" defaultValue={active.weather} />
                </div>

                <div className="log-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="k">Notes</label>
                  <textarea defaultValue={active.notes} rows={5} />
                  <span className="hint">
                    Free text. Gets indexed for search and surfaces on future trip planning to this location.
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="micro" style={{ marginBottom: 10 }}>
                  Actuals
                </div>
                <div className="log-actuals">
                  <ActualCard label="Power consumed" value={active.power} unit="Wh" predicted={1576} editable />
                  <ActualCard label="Water consumed" value={active.water} unit="gal" predicted={2.4} editable />
                  <ActualCard label="Fuel" value={active.fuel} unit="gal" predicted={0} editable />
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="micro" style={{ marginBottom: 10 }}>
                  Waypoints visited &middot; {active.waypoints.length}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {active.waypoints.map((w, i) => (
                    <span key={i} className="chip on" style={{ cursor: "default" }}>
                      {w}
                    </span>
                  ))}
                  <button type="button" className="chip">
                    + Add waypoint
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="micro" style={{ marginBottom: 10 }}>
                  Photos &middot; {active.photos} attached
                </div>
                <div className="photo-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`photo-slot ${i < active.photos ? "filled" : ""}`}>
                      {i < active.photos ? "" : "Drop / tap"}
                    </div>
                  ))}
                </div>
                <div className="hint" style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 8 }}>
                  Photo attachments deferred to v0.2 (MinIO storage). Slots shown for layout.
                </div>
              </div>
            </div>

            <div className="card card-tinted" style={{ marginTop: 16, padding: 16 }}>
              <div className="micro" style={{ marginBottom: 6 }}>
                Sync &middot; per ADR-008
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-soft)", lineHeight: 1.5 }}>
                v0.1 writes are standard HTTP &mdash; Vagabond requires Starlink/LAN reachable to save. True offline
                writes (PWA + IndexedDB) deferred to v0.3+ when the schema is stable.
              </p>
            </div>
          </section>

          <aside>
            <div className="card" style={{ padding: 18 }}>
              <div className="micro" style={{ marginBottom: 6 }}>
                Trip context
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <FactRow k="Trip" v={active.tripName} />
                <FactRow k="Started" v={<span className="mono">Apr 26, 2026</span>} />
                <FactRow k="Day" v={`${active.day} of 3`} />
                <FactRow
                  k="Logs synced"
                  v={
                    <span className="mono">
                      {logs.filter((l) => l.synced).length} / {logs.length}
                    </span>
                  }
                />
              </ul>
            </div>

            <div className="card" style={{ marginTop: 14, padding: 18 }}>
              <div className="micro" style={{ marginBottom: 6 }}>
                Quick add
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                <button type="button" className="btn-sm ghost">
                  ⛽ Fuel stop
                </button>
                <button type="button" className="btn-sm ghost">
                  💧 Water fill
                </button>
                <button type="button" className="btn-sm ghost">
                  📷 Photo
                </button>
                <button type="button" className="btn-sm ghost">
                  ⚠ Incident
                </button>
                <button type="button" className="btn-sm ghost feature-online">
                  📍 Pin to catalog
                </button>
                <button type="button" className="btn-sm ghost">
                  📝 Free note
                </button>
              </div>
            </div>

            <div className={`card ${isStarlink || isOffline ? "card-accent" : ""}`} style={{ marginTop: 14, padding: 18 }}>
              <div className="micro" style={{ marginBottom: 6 }}>
                Connectivity
              </div>
              {isOffline ? (
                <>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#7a2a1d", lineHeight: 1.5 }}>
                    <b>Offline.</b> Edits won&apos;t persist in v0.1 &mdash; values shown are browser state only. The PWA
                    queue lands in v0.3+.
                  </p>
                  <div style={{ marginTop: 10, fontSize: 11, color: "#7a2a1d", fontFamily: "var(--font-mono)" }}>
                    1 log queued locally · 4 photos pending
                  </div>
                </>
              ) : isStarlink ? (
                <p style={{ margin: 0, fontSize: 12.5, color: "#5a3a26", lineHeight: 1.5 }}>
                  <b>Starlink LAN.</b> Vagabond server reachable on local network. Writes succeed normally; external
                  integrations (Google sync) gated on uplink.
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-soft)", lineHeight: 1.5 }}>
                  Online &mdash; full read/write to home server and all integrations.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
