"use client";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { CategoryStack } from "../primitives";

export function MoneyBudgetCard({ tripDays }: { tripDays: number }) {
  const D = getVagabondMockData();
  const M = D.money;
  const tb = M.tripBudget;
  const last = M.lastTrip;
  const preSpent = tb.preTripSpend.reduce((a, t) => a + t.amount, 0);
  const days = tripDays || tb.perDay.length;
  return (
    <div className="budget-card">
      <div className="micro" style={{ marginBottom: 4 }}>
        Money
      </div>
      <h3>
        ${tb.total.toLocaleString()}{" "}
        <span className="mono" style={{ fontSize: 14, color: "var(--color-text-soft)" }}>
          planned over {days} days
        </span>
      </h3>
      <div className="budget-sub">
        ${(tb.total / days).toFixed(0)}/day avg &middot; {tb.categories.filter((c) => c.planned > 0).length} active
        categories
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
          <span>Pre-trip spend</span>
          <span className="mono" style={{ color: "var(--color-text-soft)" }}>
            ${preSpent.toFixed(2)} / ${tb.total}
          </span>
        </div>
        <div className="budget-meter">
          <div className="budget-meter-fill" style={{ width: `${(preSpent / tb.total) * 100}%` }} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="micro" style={{ marginBottom: 8 }}>
          By category
        </div>
        <CategoryStack categories={tb.categories} total={tb.total} />
      </div>

      <div className="divider" />
      <div className="micro" style={{ marginBottom: 6 }}>
        By day
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12.5 }}>
        {tb.perDay.map((d) => (
          <li
            key={d.day}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px dashed var(--color-line)",
            }}
          >
            <span>
              Day {d.day} &middot; {d.label}
            </span>
            <span className="mono" style={{ color: "var(--color-text-soft)" }}>
              ${d.planned}
            </span>
          </li>
        ))}
      </ul>

      <div className="divider" />
      <div className="micro" style={{ marginBottom: 6 }}>
        Last trip calibration
      </div>
      <div style={{ fontSize: 12.5, color: "var(--color-text-soft)", lineHeight: 1.5 }}>
        Kelso weekend ran{" "}
        <span className="mono" style={{ color: "var(--warn)" }}>
          +{(((last.actual - last.planned) / last.planned) * 100).toFixed(1)}%
        </span>{" "}
        over budget (${last.actual.toFixed(2)} vs ${last.planned.toFixed(2)}). Categories shifted: <b>fuel</b> +11%,{" "}
        <b>food</b> +22%.
      </div>
      <button type="button" className="btn-sm ghost" style={{ marginTop: 10, width: "100%" }}>
        Apply Kelso variances to plan
      </button>
    </div>
  );
}
