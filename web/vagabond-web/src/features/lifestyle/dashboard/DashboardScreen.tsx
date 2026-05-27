"use client";

import Link from "next/link";

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

export type DashboardScreenProps = LifestyleNavigateProps & {
  onTripSelect?: (tripId: string) => void;
};

export function DashboardScreen({ onNavigate, onTripSelect }: DashboardScreenProps = {}) {
  const goto = useLifestyleNavigate({ onNavigate });
  const D = getVagabondMockData();
  const { dashboard: dash, trip, money: M } = D;
  const last = M.lastTrip;
  const lastDelta = ((last.actual - last.planned) / last.planned) * 100;
  const tripDays = D.waterBudget.tripDays ?? D.days.length;
  const budgetFoot = `$${(M.tripBudget.total / tripDays).toFixed(0)}/day avg · ${M.tripBudget.categories.length} categories`;

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
          <span className="micro">{dash.todayLine}</span>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 34,
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              lineHeight: 1.05,
            }}
          >
            {dash.headline}
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
        {dash.kpis.slice(0, 3).map((kpi) => (
          <KPI
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit || undefined}
            foot={kpi.foot}
          />
        ))}
        <KPI
          label="Trip budget"
          value={`$${M.tripBudget.total.toLocaleString()}`}
          foot={budgetFoot}
        />
        {dash.kpis.slice(3).map((kpi) => (
          <KPI
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            foot={kpi.foot}
            accent={kpi.accent}
          />
        ))}
      </section>

      <div className="dash-grid">
        <section>
          <SectionHead title="Upcoming" right={dash.upcoming.sectionRight} />
          <Link
            href="/lifestyle/planner"
            style={{ display: "block", textDecoration: "none", color: "inherit" }}
            onClick={() => onTripSelect?.(trip.id)}
          >
            <TripCard
              trip={trip}
              active
              tripDate={dash.upcoming.tripDate}
              routeSubtitle={dash.upcoming.routeSubtitle}
              feasibilityLabel={dash.upcoming.feasibilityLabel}
            />
          </Link>

          <section style={{ marginTop: 24 }}>
            <SectionHead title="Last trip" right="Reconcile actuals" />
            <article
              className="card"
              style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}
            >
              {dash.lastTripReconcile.map((stat) => (
                <ReconcileStat
                  key={stat.label}
                  label={stat.label}
                  predicted={stat.predicted}
                  actual={stat.actual}
                  unit={stat.unit}
                  delta={stat.delta}
                />
              ))}
              <ReconcileStat
                label="Money spent"
                predicted={`$${last.planned.toFixed(0)}`}
                actual={`$${last.actual.toFixed(2)}`}
                unit=""
                delta={lastDelta}
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
                {last.name} &middot; {last.window} &middot;{" "}
                <span className="mono">{M.transactions.parsed} transactions reconciled</span>
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
            <TripBurnCard money={M} tripName={trip.name} onNavigate={onNavigate} />
          </section>

          <section style={{ marginTop: 18 }}>
            <SectionHead title="Catalog" right={`${dash.catalogTotal} locations`} />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {dash.catalogCounts.map(({ label, count }) => (
                <li
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px dashed var(--color-line)",
                    fontSize: 13,
                  }}
                >
                  <span>{label}</span>
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
