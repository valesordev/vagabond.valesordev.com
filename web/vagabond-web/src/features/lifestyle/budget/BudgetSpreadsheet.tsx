"use client";

import { getVagabondMockData, type PowerLoad } from "@/lib/mock/vagabond-data";
import { ParamRow } from "../primitives";
import type { BudgetTotals } from "./BudgetVisual";

export function BudgetSpreadsheet({
  totals,
  loads,
  updateLoad,
  psh,
  setPsh,
  waterRate,
  setWaterRate,
}: {
  totals: BudgetTotals;
  loads: PowerLoad[];
  updateLoad: (i: number, field: "watts" | "hours", value: string) => void;
  psh: number;
  setPsh: (v: number) => void;
  waterRate: number;
  setWaterRate: (v: number) => void;
}) {
  const D = getVagabondMockData();
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "var(--hairline)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="micro">Power loads</div>
            <h3 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
              {loads.length} devices &middot; {Math.round(totals.consumed)} Wh/day total
            </h3>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-sm ghost">
              + Add load
            </button>
            <button type="button" className="btn-sm ghost">
              Import from rig
            </button>
          </div>
        </div>
        <table className="budget-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px 18px" }}>Device</th>
              <th>Watts</th>
              <th>Hours/day</th>
              <th>Wh/day</th>
              <th>Share</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l, i) => (
              <tr key={i}>
                <td className="name" style={{ padding: "8px 18px" }}>
                  {l.name}
                </td>
                <td>
                  <input
                    className="num-input"
                    type="number"
                    value={l.watts}
                    onChange={(e) => updateLoad(i, "watts", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="num-input"
                    type="number"
                    step="0.5"
                    value={l.hours}
                    onChange={(e) => updateLoad(i, "hours", e.target.value)}
                  />
                </td>
                <td className="mono">{l.watts * l.hours}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 80,
                        height: 5,
                        background: "var(--color-bg-lift)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(l.watts * l.hours / totals.consumed) * 100}%`,
                          height: "100%",
                          background: i % 2 === 0 ? "var(--color-primary)" : "var(--color-secondary)",
                        }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                      {Math.round((l.watts * l.hours / totals.consumed) * 100)}%
                    </span>
                  </div>
                </td>
                <td>
                  <button type="button" className="btn-sm ghost" style={{ padding: "2px 8px", fontSize: 11 }}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="name" style={{ padding: "10px 18px" }}>
                Total consumption
              </td>
              <td></td>
              <td></td>
              <td className="mono">{totals.consumed}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "var(--hairline)" }}>
            <div className="micro">Solar + battery</div>
          </div>
          <div style={{ padding: 18 }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <tbody>
                <ParamRow k="Solar panels" v="2 × 200W" />
                <ParamRow
                  k="Peak sun hours/day"
                  v={
                    <input
                      className="num-input"
                      type="number"
                      step="0.1"
                      value={psh}
                      onChange={(e) => setPsh(Number(e.target.value))}
                    />
                  }
                />
                <ParamRow k="Daily production" v={<span className="mono">{Math.round(totals.produced)} Wh</span>} />
                <ParamRow k="Daily consumption" v={<span className="mono">{totals.consumed} Wh</span>} />
                <ParamRow
                  k="Net daily"
                  v={
                    <span className="mono" style={{ color: totals.net < 0 ? "var(--warn)" : "var(--ok)" }}>
                      {totals.net >= 0 ? "+" : ""}
                      {Math.round(totals.net)} Wh
                    </span>
                  }
                />
                <ParamRow
                  k="Battery capacity"
                  v={<span className="mono">{D.battery.capacityWh.toLocaleString()} Wh</span>}
                />
                <ParamRow k="Reserve after trip" v={<span className="mono">{Math.round(totals.reserve)} Wh</span>} />
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "var(--hairline)" }}>
            <div className="micro">Water</div>
          </div>
          <div style={{ padding: 18 }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <tbody>
                <ParamRow k="Carry capacity" v={<span className="mono">{D.waterBudget.carryGallons} gal</span>} />
                <ParamRow
                  k="Rate / day"
                  v={
                    <input
                      className="num-input"
                      type="number"
                      step="0.1"
                      value={waterRate}
                      onChange={(e) => setWaterRate(Number(e.target.value))}
                    />
                  }
                />
                <ParamRow k="Trip days" v={<span className="mono">3</span>} />
                <ParamRow k="Resupply" v={<span className="mono">Day 2 · Van Horn</span>} />
                <ParamRow
                  k="End reserve"
                  v={<span className="mono">{(D.waterBudget.carryGallons - waterRate * 3).toFixed(1)} gal</span>}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "var(--hairline)" }}>
          <div className="micro">Meal plan</div>
        </div>
        <table className="budget-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px 18px" }}>Day</th>
              <th>Breakfast</th>
              <th>Lunch</th>
              <th>Dinner</th>
              <th>Calories</th>
            </tr>
          </thead>
          <tbody>
            {D.foodPlan.map((d) => (
              <tr key={d.day}>
                <td className="name" style={{ padding: "8px 18px" }}>
                  Day {d.day}
                </td>
                <td>{d.meals[0]}</td>
                <td>{d.meals[1]}</td>
                <td>{d.meals[2]}</td>
                <td className="mono">{d.cal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "var(--hairline)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div className="micro">Monetary budget</div>
            <h3 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
              ${D.money.tripBudget.total} planned &middot;{" "}
              <span className="mono" style={{ fontSize: 13, color: "var(--color-text-soft)" }}>
                USD &middot; 3 days
              </span>
            </h3>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-sm ghost">
              + Add category
            </button>
            <button type="button" className="btn-sm ghost">
              Import last trip actuals
            </button>
          </div>
        </div>
        <table className="budget-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px 18px" }}>Category</th>
              <th>Planned</th>
              <th>Per day</th>
              <th>Share</th>
              <th>Last trip actual</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {D.money.tripBudget.categories.map((c) => {
              const last = D.money.lastTrip.categories.find((x) => x.key === c.key);
              const pct = (c.planned / D.money.tripBudget.total) * 100;
              return (
                <tr key={c.key}>
                  <td className="name" style={{ padding: "8px 18px" }}>
                    <span className={`cat-swatch cat-${c.key}`} style={{ marginRight: 8, verticalAlign: "middle" }} />
                    {c.label}
                  </td>
                  <td>
                    <input className="num-input" type="number" defaultValue={c.planned} />
                  </td>
                  <td className="mono">${(c.planned / 3).toFixed(2)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 80,
                          height: 5,
                          background: "var(--color-bg-lift)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div className={`cat-${c.key}`} style={{ width: `${pct}%`, height: "100%" }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="mono">{last ? `$${last.actual.toFixed(2)}` : "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-soft)" }}>{c.note}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="name" style={{ padding: "10px 18px" }}>
                Total
              </td>
              <td className="mono">${D.money.tripBudget.total}</td>
              <td className="mono">${(D.money.tripBudget.total / 3).toFixed(2)}</td>
              <td></td>
              <td className="mono">${D.money.lastTrip.actual.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
