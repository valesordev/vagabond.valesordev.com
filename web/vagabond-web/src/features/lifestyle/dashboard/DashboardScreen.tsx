"use client";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { useLifestyleNavigate } from "../navigation";
import {
  KPI,
  ReconcileStat,
  SectionHead,
  SystemStatus,
  TripBurnCard,
  TripCard,
} from "../primitives";
import type { LifestyleNavigateProps } from "../types";

const CATALOG_COUNTS: [string, number][] = [
  ["Campsites", 47],
  ["Trailheads", 31],
  ["Water sources", 14],
  ["POI", 38],
  ["Hazards", 12],
];

export type DashboardScreenProps = LifestyleNavigateProps & {
  onTripSelect?: (tripId: string) => void;
};

export function DashboardScreen({ onNavigate, onTripSelect }: DashboardScreenProps = {}) {
  const goto = useLifestyleNavigate({ onNavigate });
  const D = getVagabondMockData();
  const trip = D.trip;
  const M = D.money;
  const last = M.lastTrip;
  const lastDelta = ((last.actual - last.planned) / last.planned) * 100;

  const openPlanner = () => {
    onTripSelect?.(trip.id);
    goto("planner");
  };

  return (
    <div className="page">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 18,
        }}
      >
        <section>
          <span className="micro">Today &middot; Sun, May 17, 2026 &middot; Mojave preserve</span>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 34,
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              lineHeight: 1.05,
            }}
          >
            One trip on the horizon.
          </h1>
        </section>
        <section style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn-sm ghost">
            Import GPX
          </button>
          <button type="button" className="btn-sm">
            New trip
          </button>
        </section>
      </header>

      <section className="kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <KPI label="Days to departure" value="1" unit="d" foot="Tomorrow, 06:30 PDT" />
        <KPI label="Total drive" value="1,819" unit="mi" foot="27h 48m over 3 days" />
        <KPI label="Work stops" value="2" unit="" foot="3 meetings scheduled" />
        <KPI
          label="Trip budget"
          value={`$${M.tripBudget.total}`}
          foot={`$${(M.tripBudget.total / 3).toFixed(0)}/day avg · ${M.tripBudget.categories.length} categories`}
        />
        <KPI label="Schedule feasibility" value="Caution" foot="1 stop with tight buffer" accent />
      </section>

      <div className="dash-grid">
        <section>
          <SectionHead title="Upcoming" right="1 trip" />
          <div role="button" tabIndex={0} onClick={openPlanner} onKeyDown={(e) => e.key === "Enter" && openPlanner()}>
            <TripCard trip={trip} active />
          </div>

          <section style={{ marginTop: 24 }}>
            <SectionHead title="Last trip" right="Reconcile actuals" />
            <article
              className="card"
              style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}
            >
              <ReconcileStat label="Solar produced" predicted="1,488" actual="1,210" unit="Wh/d" delta={-18.7} />
              <ReconcileStat label="Power drawn" predicted="1,576" actual="1,612" unit="Wh/d" delta={+2.3} />
              <ReconcileStat label="Water used" predicted="2.4" actual="2.8" unit="gal/d" delta={+16.7} />
              <ReconcileStat label="Peak sun" predicted="6.2" actual="5.4" unit="h" delta={-12.9} />
              <ReconcileStat
                label="Money spent"
                predicted={`$${last.planned.toFixed(0)}`}
                actual={`$${last.actual.toFixed(2)}`}
                unit=""
                delta={+lastDelta}
              />
            </article>
            <footer
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--color-text-soft)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                Kelso Dunes weekend &middot; Apr 26&ndash;28, 2026 &middot;{" "}
                <span className="mono">9 transactions reconciled</span>
              </span>
              <button type="button" className="btn-sm ghost" onClick={() => goto("reconcile")}>
                Apply as defaults &rarr;
              </button>
            </footer>
          </section>
        </section>

        <aside>
          <SectionHead title="System" />
          <SystemStatus />

          <section style={{ marginTop: 18 }}>
            <SectionHead
              title="Money"
              right={`YTD $${M.ytd.totalSpend.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />
            <TripBurnCard money={M} onNavigate={onNavigate} />
          </section>

          <section style={{ marginTop: 18 }}>
            <SectionHead title="Catalog" right="142 locations" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {CATALOG_COUNTS.map(([name, count]) => (
                <li
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px dashed var(--color-line)",
                    fontSize: 13,
                  }}
                >
                  <span>{name}</span>
                  <span className="mono" style={{ color: "var(--color-text-soft)" }}>
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
