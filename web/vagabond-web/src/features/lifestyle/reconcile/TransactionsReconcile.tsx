"use client";

import { useState } from "react";
import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { ImportTile } from "./ImportTile";

const CATS = ["fuel", "camp", "food", "supplies", "maint", "misc"] as const;
const CAT_LABEL: Record<string, string> = {
  fuel: "Fuel",
  camp: "Camp",
  food: "Food",
  supplies: "Supplies",
  maint: "Maint.",
  misc: "Misc",
};

export function TransactionsReconcile() {
  const D = getVagabondMockData();
  const M = D.money;
  const tx = M.transactions;
  const last = M.lastTrip;

  const [imported, setImported] = useState(true);
  const [rows, setRows] = useState(tx.rows);

  const updateCat = (id: string, nextCat: string) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, category: nextCat, status: "matched" as const } : r)));
  };
  const accept = (id: string) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status: "matched" as const } : r)));
  };

  const rollup = CATS.map((k) => {
    const catRows = rows.filter((r) => r.category === k);
    const sum = catRows.reduce((a, r) => a + r.amount, 0);
    const planned = (last.categories.find((c) => c.key === k) || {}).planned || 0;
    return { key: k, label: CAT_LABEL[k], planned, actual: sum, count: catRows.length };
  });
  const totalImported = rows.reduce((a, r) => a + r.amount, 0);
  const totalPlanned = rollup.reduce((a, c) => a + c.planned, 0);
  const overallDelta = ((totalImported - totalPlanned) / totalPlanned) * 100;
  const needsReview = rows.filter((r) => r.status === "needs-review").length;

  return (
    <div className="card" style={{ marginTop: 20, padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "var(--hairline)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div className="micro">Transactions &middot; statement reconcile</div>
          <h3 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
            Card charges &rarr; categories &rarr; trip budget
          </h3>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn-sm ghost">
            Import another statement
          </button>
          <button type="button" className="btn-sm sage" disabled={needsReview > 0}>
            {needsReview > 0 ? `Resolve ${needsReview} first` : "Lock in actuals"}
          </button>
        </div>
      </div>

      {!imported && (
        <div style={{ padding: 28 }}>
          <ImportTile onLoad={() => setImported(true)} />
        </div>
      )}

      {imported && (
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
          <div>
            <div className="import-meta">
              <div>
                <span className="micro">Source</span>
                <div style={{ fontSize: 12.5, marginTop: 2 }}>
                  <span className="mono">{tx.source}</span>
                </div>
              </div>
              <div>
                <span className="micro">Uploaded</span>
                <div style={{ fontSize: 12.5, marginTop: 2 }} className="mono">
                  {tx.uploadedAt}
                </div>
              </div>
              <div>
                <span className="micro">Parsed</span>
                <div style={{ fontSize: 12.5, marginTop: 2 }}>
                  <span className="mono">{tx.parsed}</span> rows &middot;{" "}
                  <span className="mono">{tx.autoCategorized}</span> auto-categorized &middot;{" "}
                  <span className="mono" style={{ color: needsReview > 0 ? "var(--warn)" : "var(--ok)" }}>
                    {needsReview}
                  </span>{" "}
                  need review
                </div>
              </div>
            </div>

            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.status === "needs-review" ? "review" : ""}>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {r.date}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.merchant}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>
                        {r.raw}
                      </div>
                      {r.note && (
                        <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 2 }}>↳ {r.note}</div>
                      )}
                    </td>
                    <td>
                      <select
                        className={`cat-select cat-${r.category}`}
                        value={r.category}
                        onChange={(e) => updateCat(r.id, e.target.value)}
                      >
                        {CATS.map((c) => (
                          <option key={c} value={c}>
                            {CAT_LABEL[c]}
                          </option>
                        ))}
                      </select>
                      <div className="mono" style={{ fontSize: 10, color: "var(--color-text-faint)", marginTop: 3 }}>
                        conf {(r.confidence * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                      ${r.amount.toFixed(2)}
                    </td>
                    <td>
                      {r.status === "matched" ? (
                        <span className="pill ok">
                          <span className="dot" />
                          matched
                        </span>
                      ) : (
                        <span className="pill warn">
                          <span className="dot" />
                          review
                        </span>
                      )}
                    </td>
                    <td>
                      {r.status === "needs-review" && (
                        <button
                          type="button"
                          className="btn-sm ghost"
                          style={{ padding: "2px 8px", fontSize: 11 }}
                          onClick={() => accept(r.id)}
                        >
                          Accept
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: "10px 8px", fontWeight: 600 }}>
                    Total imported
                  </td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                    ${totalImported.toFixed(2)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <div className="micro" style={{ marginBottom: 10 }}>
              Rollup &middot; vs Kelso budget
            </div>
            <ul className="rollup-list">
              {rollup.map((c) => {
                const delta = c.planned > 0 ? ((c.actual - c.planned) / c.planned) * 100 : null;
                const pct = totalImported > 0 ? (c.actual / totalImported) * 100 : 0;
                return (
                  <li key={c.key}>
                    <div className="rollup-row">
                      <span className={`cat-swatch cat-${c.key}`} />
                      <span className="rollup-label">{c.label}</span>
                      <span className="mono rollup-amt">${c.actual.toFixed(2)}</span>
                      {delta !== null ? (
                        <span
                          className={`cat-delta ${Math.abs(delta) < 10 ? "ok" : Math.abs(delta) < 25 ? "warn" : "err"}`}
                        >
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="cat-delta">—</span>
                      )}
                    </div>
                    <div className="rollup-bar">
                      <div className={`rollup-bar-fill cat-${c.key}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)", marginTop: 2 }}>
                      planned ${c.planned.toFixed(2)} &middot; {c.count} txn
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="divider" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Trip total</span>
              <span className="mono" style={{ fontWeight: 600 }}>
                ${totalImported.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0 8px",
                fontSize: 12,
                color: "var(--color-text-soft)",
              }}
            >
              <span>vs ${totalPlanned.toFixed(2)} planned</span>
              <span className={`mono ${Math.abs(overallDelta) < 10 ? "" : "cat-delta warn"}`}>
                {overallDelta >= 0 ? "+" : ""}
                {overallDelta.toFixed(1)}%
              </span>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: "var(--color-bg-lift)",
                borderRadius: 6,
                fontSize: 11.5,
                color: "var(--color-text-soft)",
                lineHeight: 1.55,
              }}
            >
              <div className="micro" style={{ marginBottom: 4 }}>
                How matching works
              </div>
              CSV rows are parsed locally. Merchant strings are normalized and matched against a learned dictionary
              built from prior trips. Anything below 70% confidence is flagged for review &mdash; you stay in control of
              the categorization.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
