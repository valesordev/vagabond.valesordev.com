"use client";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { useLifestyleNavigate } from "../navigation";
import { FactRow, SectionHead } from "../primitives";
import type { LifestyleNavigateProps } from "../types";
import { CatalogMap } from "./CatalogMap";
import { Signal, TypeChip } from "./catalog-primitives";

export type LocationDetailScreenProps = LifestyleNavigateProps & {
  locId?: string;
};

export function LocationDetailScreen({ onNavigate, locId }: LocationDetailScreenProps = {}) {
  const goto = useLifestyleNavigate({ onNavigate });
  const D = getVagabondMockData();
  const loc = D.catalog.find((l) => l.id === locId) || D.catalog[0];

  const noteRows = [
    {
      time: "Apr 28, 2026",
      title: "Solid spring weather; sand firmly packed after rain last week. Cell weak but Starlink clean.",
      kind: "Visited",
    },
    {
      time: "Mar 14, 2026",
      title: "Lots of side trails marked since last visit. Stayed at site 3 \u2014 quietest.",
      kind: "Visited",
    },
    {
      time: "Jan 6, 2026",
      title: "First-ever stay. Pulled in 17:30, sunset 17:42. Camped near the south ridge. Coyotes overnight.",
      kind: "Visited",
    },
  ].slice(0, Math.min(3, loc.notes || 0));

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <div className="topbar-crumb">
              <span style={{ cursor: "pointer", color: "var(--color-secondary)" }} onClick={() => goto("catalog")}>
                ← Catalog
              </span>
              {" · "}
              {loc.jurisdiction} · {loc.landUnit}
            </div>
            <div className="topbar-title">{loc.name}</div>
          </div>
        </div>
        <div className="topbar-right">
          <TypeChip type={loc.type} />
          <span
            className={`pill ${loc.conditions === "good" ? "ok" : loc.conditions === "avoid" ? "err" : "warn"}`}
          >
            <span className="dot" />
            {loc.conditions}
          </span>
          <button type="button" className="btn-sm ghost">
            Add to trip
          </button>
          <button type="button" className="btn-sm ghost">
            Export GPX
          </button>
        </div>
      </div>

      <div className="page page-narrow">
        <div className="loc-detail-grid">
          <section>
            <div className="loc-map-card">
              <CatalogMap locations={[loc]} selectedId={loc.id} setSelected={() => {}} />
            </div>

            <div style={{ marginTop: 18 }}>
              <SectionHead title="Notes & conditions" right={`${loc.notes} notes`} />
              <div className="timeline">
                {loc.hazard && (
                  <div className="tl-row" style={{ borderLeft: "3px solid var(--err)" }}>
                    <div className="tl-time">
                      <span className="big" style={{ color: "var(--err)" }}>
                        !
                      </span>
                      <span>Hazard</span>
                    </div>
                    <div>
                      <div className="micro" style={{ color: "var(--err)", marginBottom: 4 }}>
                        Active warning
                      </div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{loc.hazard}</div>
                    </div>
                  </div>
                )}
                {noteRows.map((n, i) => (
                  <div key={i} className="tl-row">
                    <div className="tl-time">
                      <span className="big" style={{ fontSize: 13 }}>
                        {n.time}
                      </span>
                      <span>{n.kind}</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{n.title}</div>
                  </div>
                ))}
                <button type="button" className="btn-sm ghost feature-online" style={{ alignSelf: "flex-start" }}>
                  + Add note
                </button>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <SectionHead title="Used in" right="3 trips" />
              <div className="card" style={{ padding: 0 }}>
                {[
                  ["GA Pickup", "May 18, 2026", "Upcoming"],
                  ["Kelso Dunes weekend", "Apr 26, 2026", "Completed"],
                  ["Joshua Tree March", "Mar 13, 2026", "Completed"],
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 140px 100px",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: i < 2 ? "1px dashed var(--color-line)" : "none",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{row[0]}</span>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--color-text-soft)" }}>
                      {row[1]}
                    </span>
                    <span className="pill neutral">{row[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside>
            <div className="card" style={{ padding: 18 }}>
              <div className="micro" style={{ marginBottom: 8 }}>
                Facts
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
                <FactRow k="Location ID" v={<span className="mono" style={{ fontSize: 11 }}>{loc.id}</span>} />
                <FactRow
                  k="Coordinates"
                  v={
                    <span className="mono" style={{ fontSize: 11 }}>
                      {loc.coords[1].toFixed(4)}, {loc.coords[0].toFixed(4)}
                    </span>
                  }
                />
                <FactRow k="Elevation" v={<span className="mono">{loc.elev.toLocaleString()} ft</span>} />
                <FactRow k="Jurisdiction" v={loc.jurisdiction} />
                <FactRow k="Land unit" v={loc.landUnit} />
                <FactRow k="Fee" v={loc.fee} />
              </ul>
            </div>

            <div className="card" style={{ marginTop: 14, padding: 18 }}>
              <div className="micro" style={{ marginBottom: 8 }}>
                Connectivity
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 10, fontSize: 13 }}>
                <span>Cellular signal</span>
                <span>
                  <Signal bars={loc.cellSignal} />{" "}
                  <span className="mono" style={{ fontSize: 11, marginLeft: 4, color: "var(--color-text-soft)" }}>
                    {loc.cellSignal}/5
                  </span>
                </span>
                <span>Starlink line-of-sight</span>
                <span>
                  {loc.starlinkOk ? (
                    <span className="pill ok">
                      <span className="dot" />
                      Clear sky
                    </span>
                  ) : (
                    <span className="pill err">
                      <span className="dot" />
                      Blocked
                    </span>
                  )}
                </span>
                <span>Sky exposure</span>
                <span
                  className="mono"
                  style={{ fontSize: 12, color: "var(--color-text-soft)", textTransform: "capitalize" }}
                >
                  {loc.sky}
                </span>
                <span>Potable water</span>
                <span className="mono" style={{ fontSize: 12 }}>
                  {loc.water ? "Yes, on site" : "Bring your own"}
                </span>
              </div>
            </div>

            <div className="card card-accent" style={{ marginTop: 14, padding: 18 }}>
              <div className="micro" style={{ marginBottom: 8, color: "#4a3a26" }}>
                Agentic enrichment
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#4a3a26", lineHeight: 1.5 }}>
                LLM-assisted research will populate permit rules, seasonal closures, and recent visitor reports for this
                location.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                <span className="pill neutral">
                  <span className="dot" />
                  Deferred · v0.4
                </span>
                <button type="button" className="btn-sm ghost" style={{ marginLeft: "auto" }} disabled>
                  Enable
                </button>
              </div>
            </div>

            <div className="card" style={{ marginTop: 14, padding: 18 }}>
              <div className="micro" style={{ marginBottom: 8 }}>
                Provenance
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: 12.5,
                  color: "var(--color-text-soft)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <li>
                  <b style={{ color: "var(--color-text)" }}>Source:</b> Manual entry
                </li>
                <li>
                  <b style={{ color: "var(--color-text)" }}>Added:</b> Oct 14, 2025
                </li>
                <li>
                  <b style={{ color: "var(--color-text)" }}>Owner:</b> brian@solo7.media
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
