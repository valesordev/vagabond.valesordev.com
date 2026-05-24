"use client";

import { useState } from "react";
import { getVagabondMockData, type Stop } from "@/lib/mock/vagabond-data";
import { VagabondMap } from "../map/VagabondMap";
import { DayBlock } from "./DayBlock";
import { StopInfoCard } from "./StopInfoCard";

export function PlannerMapDominant({
  stops,
  route,
  selectedId,
  setSelected,
}: {
  stops: Stop[];
  route: [number, number][];
  selectedId: string;
  setSelected: (id: string) => void;
}) {
  const D = getVagabondMockData();
  const [showFallback, setShowFallback] = useState(true);
  const sel = stops.find((s) => s.id === selectedId);

  return (
    <div className="planner map-dom">
      <aside className="planner-rail">
        <div className="rail-header">
          <div className="micro" style={{ marginBottom: 4 }}>
            Itinerary
          </div>
          <h2>3 days, 1,819 mi</h2>
          <div className="rail-meta">
            <span className="mono">Mojave, CA</span>
            <span style={{ color: "var(--color-text-faint)" }}>&rarr;</span>
            <span className="mono">Atlanta, GA</span>
            <span style={{ marginLeft: "auto" }} className="pill neutral">
              PDT ↔ EDT
            </span>
          </div>
        </div>

        {D.days.map((day) => (
          <DayBlock
            key={day.num}
            day={day}
            stops={stops.filter(
              (s) =>
                s.day === day.num ||
                (day.num === 1 && s.kind === "origin") ||
                (day.num === 3 && s.kind === "destination"),
            )}
            selectedId={selectedId}
            setSelected={setSelected}
          />
        ))}

        <div style={{ padding: "16px 20px", borderTop: "var(--hairline)", background: "var(--color-bg-lift)" }}>
          <button type="button" className="btn-sm ghost" style={{ width: "100%" }}>
            + Add work stop or waypoint
          </button>
        </div>
      </aside>

      <div className="planner-map">
        <VagabondMap
          stops={stops}
          route={route}
          selectedId={selectedId}
          onSelect={setSelected}
          showFallback={showFallback}
        />

        <div className="map-overlay tl">
          <div className="micro" style={{ marginBottom: 6 }}>
            Map &middot; Warm topo
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-soft)", maxWidth: 220 }}>
            PMTiles &middot; OSM &middot; CONUS-W extract
            <br />
            <span className="mono" style={{ fontSize: 10.5 }}>
              4.2 GB &middot; offline ready
            </span>
          </div>
        </div>

        <div className="map-overlay tr">
          <div className="micro" style={{ marginBottom: 8 }}>
            Legend
          </div>
          <div className="map-legend">
            <div className="map-legend-row">
              <span className="sw" style={{ background: "var(--map-route)" }} /> Planned route
            </div>
            <div className="map-legend-row">
              <span className="sw" style={{ background: "var(--color-primary)" }} /> Work stop
            </div>
            <div className="map-legend-row">
              <span className="sw" style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-secondary)" }} />{" "}
              Camp night
            </div>
            <div className="map-legend-row">
              <span className="sw" style={{ background: "transparent", border: "1.5px dashed var(--map-route-fallback)" }} />{" "}
              Fallback location
            </div>
          </div>
          <div className="divider" style={{ margin: "10px 0 8px" }} />
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showFallback}
              onChange={(e) => setShowFallback(e.target.checked)}
            />{" "}
            Show fallback stops
          </label>
        </div>

        {sel && <StopInfoCard stop={sel} />}
      </div>
    </div>
  );
}
