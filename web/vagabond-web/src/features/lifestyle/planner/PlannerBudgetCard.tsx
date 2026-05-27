"use client";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { CategoryStack } from "../primitives";

type MoneyData = ReturnType<typeof getVagabondMockData>["money"];

export function PlannerBudgetCard({ money }: { money: MoneyData }) {
  const tb = money.tripBudget;
  return (
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
        <div className="micro">Monetary budget &middot; planned</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
            {tb.categories.filter((c) => c.planned > 0).length} categories &middot; {tb.perDay.length} days
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>${tb.total}</span>
        </div>
      </div>
      <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        <div>
          <div className="micro" style={{ marginBottom: 8 }}>
            By category
          </div>
          <CategoryStack categories={tb.categories} total={tb.total} />
        </div>
        <div>
          <div className="micro" style={{ marginBottom: 8 }}>
            By day
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12.5 }}>
            {tb.perDay.map((d) => (
              <li
                key={d.day}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px dashed var(--color-line)",
                  alignItems: "baseline",
                }}
              >
                <span className="mono" style={{ color: "var(--color-text-soft)", fontSize: 11 }}>
                  Day {d.day}
                </span>
                <span style={{ color: "var(--color-text-soft)" }}>{d.label}</span>
                <span className="mono" style={{ fontWeight: 600 }}>
                  ${d.planned}
                </span>
              </li>
            ))}
            <li
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12,
                padding: "10px 0 0",
                alignItems: "baseline",
              }}
            >
              <span className="micro">Total</span>
              <span />
              <span className="mono" style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                ${tb.total}
              </span>
            </li>
          </ul>
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "var(--color-bg-lift)",
              borderRadius: 6,
              fontSize: 11.5,
              color: "var(--color-text-soft)",
              lineHeight: 1.5,
            }}
          >
            Pre-trip spend:{" "}
            <span className="mono">${tb.preTripSpend.reduce((a, t) => a + t.amount, 0).toFixed(2)}</span> already on
            card &middot; <span className="mono">{tb.preTripSpend.length}</span> charges
          </div>
        </div>
      </div>
    </div>
  );
}
