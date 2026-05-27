"use client";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import type { BudgetEditorProps } from "./BudgetScreen";
import { MoneyBudgetCard } from "./MoneyBudgetCard";
import { WaterTankSvg } from "./WaterTankSvg";

export function BudgetVisual({
  totals,
  loads,
  psh,
  setPsh,
  waterRate,
  setWaterRate,
  tripDays,
}: BudgetEditorProps) {
  const D = getVagabondMockData();
  const waterUsed = waterRate * tripDays;
  const resupply = D.waterBudget.resupply[0];
  const consumedPct = Math.min(100, (totals.consumed / totals.produced) * 100);
  const reservePct = Math.max(0, Math.min(100, (totals.reserve / D.battery.capacityWh) * 100));
  const mealCount = D.foodPlan.reduce((n, d) => n + d.meals.length, 0);
  const avgCal = Math.round(D.foodPlan.reduce((n, d) => n + d.cal, 0) / D.foodPlan.length);

  return (
    <div className="budget-grid">
      <div className="budget-card">
        <div className="micro" style={{ marginBottom: 4 }}>
          Power
        </div>
        <h3>
          {Math.round(totals.consumed).toLocaleString()}{" "}
          <span className="mono" style={{ fontSize: 14, color: "var(--color-text-soft)" }}>
            Wh/day drawn
          </span>
        </h3>
        <div className="budget-sub">
          Net <span className="mono">{totals.net >= 0 ? "+" : ""}{Math.round(totals.net)}</span> Wh/day vs. solar
          production
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Consumption vs. production</span>
            <span className="mono" style={{ color: "var(--color-text-soft)" }}>
              {consumedPct.toFixed(0)}%
            </span>
          </div>
          <div className="budget-meter">
            <div className={`budget-meter-fill ${consumedPct > 90 ? "warn" : ""}`} style={{ width: `${consumedPct}%` }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Battery reserve after {tripDays} days</span>
            <span
              className="mono"
              style={{ color: reservePct < 25 ? "var(--err)" : "var(--color-text-soft)" }}
            >
              {Math.round(totals.reserve)} / {D.battery.capacityWh} Wh
            </span>
          </div>
          <div className="budget-meter">
            <div
              className={`budget-meter-fill ${reservePct < 25 ? "err" : reservePct < 50 ? "warn" : ""}`}
              style={{ width: `${reservePct}%` }}
            />
          </div>
        </div>

        <div className="budget-readout">
          <div className="ro-row">
            <span>Solar panels</span>
            <b>
              {D.solar.panels} × {D.solar.peakWatts}W
            </b>
          </div>
          <div className="ro-row">
            <span>Battery</span>
            <b>{D.battery.capacityWh.toLocaleString()} Wh</b>
          </div>
          <div className="ro-row">
            <span>Peak sun hrs/day</span>
            <b>
              <input
                className="num-input"
                type="number"
                step="0.1"
                value={psh}
                onChange={(e) => setPsh(Number(e.target.value))}
              />
            </b>
          </div>
          <div className="ro-row">
            <span>Produced/day</span>
            <b>{Math.round(totals.produced)} Wh</b>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="micro" style={{ marginBottom: 8 }}>
            Load breakdown
          </div>
          {loads.map((l, i) => {
            const pct = (l.watts * l.hours / totals.consumed) * 100;
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span>{l.name}</span>
                  <span className="mono" style={{ color: "var(--color-text-soft)" }}>
                    {l.watts * l.hours} Wh
                  </span>
                </div>
                <div className="budget-meter" style={{ height: 4 }}>
                  <div
                    className="budget-meter-fill"
                    style={{
                      width: `${pct}%`,
                      background: i % 2 === 0 ? "var(--color-primary)" : "var(--color-secondary)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="budget-card">
        <div className="micro" style={{ marginBottom: 4 }}>
          Water
        </div>
        <h3>
          {waterUsed.toFixed(1)}{" "}
          <span className="mono" style={{ fontSize: 14, color: "var(--color-text-soft)" }}>
            gal over {tripDays} days
          </span>
        </h3>
        <div className="budget-sub">
          Carrying {D.waterBudget.carryGallons} gal &middot; resupply at {resupply?.location ?? "Van Horn"} on day{" "}
          {resupply?.day ?? 2}
        </div>

        <div style={{ marginTop: 12 }}>
          <WaterTankSvg used={waterUsed} total={D.waterBudget.carryGallons} />
        </div>

        <div className="budget-readout" style={{ marginTop: 12 }}>
          <div className="ro-row">
            <span>Carry</span>
            <b>{D.waterBudget.carryGallons} gal</b>
          </div>
          <div className="ro-row">
            <span>Rate / day</span>
            <b>
              <input
                className="num-input"
                type="number"
                step="0.1"
                value={waterRate}
                onChange={(e) => setWaterRate(Number(e.target.value))}
              />
            </b>
          </div>
          <div className="ro-row">
            <span>End reserve</span>
            <b>{(D.waterBudget.carryGallons - waterUsed).toFixed(1)} gal</b>
          </div>
          <div className="ro-row">
            <span>Resupply</span>
            <b>Day {resupply?.day ?? 2}</b>
          </div>
        </div>

        <div className="divider" />
        <div className="micro" style={{ marginBottom: 6 }}>
          By day
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12.5 }}>
          {D.days.map((d) => (
            <li
              key={d.num}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px dashed var(--color-line)",
              }}
            >
              <span>
                Day {d.num} &middot; {d.date}
              </span>
              <span className="mono" style={{ color: "var(--color-text-soft)" }}>
                {waterRate.toFixed(1)} gal
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="budget-card">
        <div className="micro" style={{ marginBottom: 4 }}>
          Food
        </div>
        <h3>
          {mealCount}{" "}
          <span className="mono" style={{ fontSize: 14, color: "var(--color-text-soft)" }}>
            meals planned
          </span>
        </h3>
        <div className="budget-sub">
          {D.foodPlan[0]?.meals.length ?? 3} meals/day &middot; avg {avgCal.toLocaleString()} cal/day
        </div>

        {D.foodPlan.map((d) => (
          <div key={d.day} style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="micro">Day {d.day}</div>
              <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                {d.cal} cal
              </span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12.5 }}>
              {d.meals.map((m, i) => (
                <li
                  key={i}
                  style={{
                    padding: "6px 0",
                    borderBottom: "1px dashed var(--color-line)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span className="mono" style={{ width: 14, color: "var(--color-text-faint)" }}>
                    {i + 1}
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <MoneyBudgetCard tripDays={tripDays} />
    </div>
  );
}
