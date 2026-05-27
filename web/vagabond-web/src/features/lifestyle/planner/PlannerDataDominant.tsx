"use client";

import { getVagabondMockData, type Stop } from "@/lib/mock/vagabond-data";
import { SummaryStat } from "../primitives";
import { VagabondMap } from "../map/VagabondMap";
import { FeasibilityPanel } from "./FeasibilityPanel";
import { ItineraryTable } from "./ItineraryTable";
import { PlannerBudgetCard } from "./PlannerBudgetCard";
import { PlannerRail } from "./PlannerRail";

function tzDriftHours(crossesTz: string): string {
  const match = crossesTz.match(/^\+(\d+)/);
  return match ? `+${match[1]}` : "+3";
}

export function PlannerDataDominant({
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
  const { trip } = D;
  const sel = stops.find((s) => s.id === selectedId);

  return (
    <div className="planner data-dom">
      <div
        className="planner-map"
        style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, background: "var(--color-bg)", overflow: "auto" }}
      >
        <div
          className="card"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", gap: 16, padding: "14px 20px" }}
        >
          <SummaryStat label="Distance" value={trip.totalMiles.toLocaleString()} unit="mi" />
          <SummaryStat label="Drive time" value={String(trip.driveHours)} unit="h" />
          <SummaryStat label="Camp nights" value={String(trip.campNights)} unit="" />
          <SummaryStat label="Meetings" value={String(trip.meetings)} unit="" />
          <SummaryStat label="TZ drift" value={tzDriftHours(trip.crossesTz)} unit="h" caution />
          <SummaryStat label="Budget" value={`$${D.money.tripBudget.total.toLocaleString()}`} unit="USD" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, flex: 1, minHeight: 0 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "var(--hairline)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="micro">Itinerary</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                {stops.length} stops
              </div>
            </div>
            <div style={{ overflow: "auto" }}>
              <ItineraryTable stops={stops} selectedId={selectedId} setSelected={setSelected} />
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 280 }}>
            <div style={{ padding: "12px 16px", borderBottom: "var(--hairline)" }}>
              <div className="micro">Route map</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: "var(--map-bg)" }}>
              <VagabondMap stops={stops} route={route} selectedId={selectedId} onSelect={setSelected} showFallback />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "var(--hairline)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="micro">
              Feasibility &middot; {sel?.kind === "workstop" ? sel.name : "Select a work stop"}
            </div>
            {sel?.feasible &&
              (sel.feasible === "warn" ? (
                <span className="pill warn">
                  <span className="dot" />
                  Tight buffer
                </span>
              ) : (
                <span className="pill ok">
                  <span className="dot" />
                  Feasible
                </span>
              ))}
          </div>
          {sel?.kind === "workstop" ? (
            <FeasibilityPanel stop={sel} />
          ) : (
            <div className="empty">Select a work stop above to inspect timing &amp; connectivity.</div>
          )}
        </div>

        <PlannerBudgetCard money={D.money} />
      </div>

      <PlannerRail stops={stops} selectedId={selectedId} setSelected={setSelected} />
    </div>
  );
}
