"use client";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { BigStat, SectionHead } from "../primitives";
import type { LifestyleNavigateProps } from "../types";
import { TransactionsReconcile } from "./TransactionsReconcile";

export function ReconcileScreen(_props: LifestyleNavigateProps = {}) {
  const D = getVagabondMockData();
  const r = D.reconciliation;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <div className="topbar-crumb">
              Trip &middot; KELSO-26 &middot; {r.window}
            </div>
            <div className="topbar-title">Reconcile actuals</div>
          </div>
        </div>
        <div className="topbar-right">
          <button type="button" className="btn-sm ghost">
            Export CSV
          </button>
          <button type="button" className="btn-sm sage">
            Apply suggested adjustments
          </button>
        </div>
      </div>

      <div className="page page-narrow">
        <div className="detail-hero">
          <div>
            <div className="micro">
              Reconciliation &middot; {r.days} days &middot; {r.window}
            </div>
            <h1>{r.trip}</h1>
            <p className="lede">
              How the trip actually went versus what we planned. The model uses these deltas to calibrate baselines
              &mdash; water consumption, peak sun hours, drive time padding &mdash; for future trips.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: 20 }}>
            <BigStat
              label="Within tolerance"
              value={r.items.filter((i) => Math.abs(i.delta_pct) < 10).length}
              unit={`of ${r.items.length}`}
            />
            <BigStat label="Adjustments" value={r.adjustmentsSuggested.length} unit="suggested" />
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="recon-table">
            <thead>
              <tr>
                <th style={{ padding: "12px 14px" }}>Metric</th>
                <th>Predicted</th>
                <th>Actual</th>
                <th style={{ width: 200 }}>Comparison</th>
                <th>Delta</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {r.items.map((it) => {
                const cls = Math.abs(it.delta_pct) < 10 ? "ok" : Math.abs(it.delta_pct) < 20 ? "warn" : "bad";
                const maxv = Math.max(it.predicted, it.actual);
                const isMoney = it.unit === "USD";
                const fmt = (v: number) => (isMoney ? `$${v.toFixed(2)}` : String(v));
                return (
                  <tr key={it.key}>
                    <td className="metric">{it.label}</td>
                    <td className="mono" style={{ width: 90 }}>
                      {fmt(it.predicted)}{" "}
                      <span style={{ color: "var(--color-text-faint)", fontSize: 10 }}>{isMoney ? "" : it.unit}</span>
                    </td>
                    <td className="mono" style={{ width: 90 }}>
                      {fmt(it.actual)}{" "}
                      <span style={{ color: "var(--color-text-faint)", fontSize: 10 }}>{isMoney ? "" : it.unit}</span>
                    </td>
                    <td>
                      <div className="recon-bar-wrap">
                        <span className="micro" style={{ fontSize: 9.5 }}>
                          Pred
                        </span>
                        <div className="recon-bar predicted">
                          <div style={{ width: `${(it.predicted / maxv) * 100}%` }} />
                        </div>
                        <span className="micro" style={{ fontSize: 9.5 }}>
                          Act
                        </span>
                        <div className="recon-bar actual">
                          <div style={{ width: `${(it.actual / maxv) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`recon-delta ${cls}`}>
                        {it.delta_pct >= 0 ? "+" : ""}
                        {it.delta_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-soft)", maxWidth: 280, lineHeight: 1.5 }}>
                      {it.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <SectionHead title="Suggested adjustments" right="Calibration" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {r.adjustmentsSuggested.map((a, i) => (
                <li
                  key={i}
                  style={{
                    padding: "12px 0",
                    borderBottom: i < r.adjustmentsSuggested.length - 1 ? "1px dashed var(--color-line)" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.what}</span>
                    <span className="mono" style={{ fontSize: 12 }}>
                      <span style={{ color: "var(--color-text-faint)", textDecoration: "line-through" }}>{a.from}</span>
                      <span style={{ margin: "0 6px", color: "var(--color-text-faint)" }}>→</span>
                      <b>{a.to}</b>
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--color-text-soft)" }}>{a.reason}</div>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-sm sage" style={{ marginTop: 14 }}>
              Apply all to defaults
            </button>
          </div>

          <div className="card card-tinted" style={{ padding: 20 }}>
            <SectionHead title="What this enables" />
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: 13,
                color: "var(--color-text-soft)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                lineHeight: 1.5,
              }}
            >
              <li>
                <b style={{ color: "var(--color-text)" }}>Rolling calibration</b> &mdash; baselines shift toward
                observed behavior after each completed trip.
              </li>
              <li>
                <b style={{ color: "var(--color-text)" }}>Tighter feasibility</b> &mdash; if peak sun hours drop, the
                planner flags marginal solar trips earlier.
              </li>
              <li>
                <b style={{ color: "var(--color-text)" }}>Trend detection</b> &mdash; consistently high water use over 5
                trips becomes the new baseline.
              </li>
            </ul>
            <div style={{ marginTop: 14, fontSize: 11, color: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }}>
              Reconciliation is the seam between predicted and observed. The engine that lives here is the budget engine
              in `vagabond-core` (ADR-007).
            </div>
          </div>
        </div>
        <TransactionsReconcile />
      </div>
    </>
  );
}
