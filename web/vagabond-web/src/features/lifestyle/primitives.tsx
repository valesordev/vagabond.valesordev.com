"use client";

import type { ReactNode } from "react";
import type { BudgetCategory, TripSummary } from "@/lib/mock/vagabond-data";
import type { LifestyleNavigateProps, LifestyleScreen } from "./types";
import { getVagabondMockData } from "@/lib/mock/vagabond-data";

type MoneyData = ReturnType<typeof getVagabondMockData>["money"];

export function KPI({
  label,
  value,
  unit,
  foot,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  foot?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`kpi ${accent ? "accent" : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
      {foot != null ? <div className="kpi-foot">{foot}</div> : null}
    </div>
  );
}

export function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 12px" }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>{title}</h2>
      {right ? <span className="micro">{right}</span> : null}
    </header>
  );
}

export function SimpleTopbar({
  crumb,
  title,
  children,
}: {
  crumb: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-crumb">{crumb}</div>
          <div className="topbar-title">{title}</div>
        </div>
      </div>
      {children ? <div className="topbar-right">{children}</div> : null}
    </div>
  );
}

const STATUS_COLOR = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
  off: "var(--color-text-faint)",
} as const;

export function StatusDot({ status }: { status: "ok" | "warn" | "err" | "off" }) {
  return (
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: STATUS_COLOR[status],
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function SectionHead2({ title, sub }: { title: string; sub?: string }) {
  return (
    <header style={{ marginBottom: 6 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{title}</h2>
      {sub ? <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-soft)" }}>{sub}</p> : null}
    </header>
  );
}

export function BigStat({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <article>
      <span className="micro" style={{ marginBottom: 4, color: "#4a3a26", display: "block" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, lineHeight: 1, display: "block" }}>
        {value}
        {unit ? <span className="mono" style={{ fontSize: 13, color: "#6b4f31", marginLeft: unit === "" ? 0 : 4 }}>{unit}</span> : null}
      </span>
    </article>
  );
}

export function FactRow({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <li style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--color-text-soft)" }}>{k}</span>
      <span style={{ textAlign: "right" }}>{v}</span>
    </li>
  );
}

function statusToDot(status: string): "ok" | "warn" | "err" | "off" {
  if (status === "ok" || status === "warn" || status === "err" || status === "off") {
    return status;
  }
  return "off";
}

export function StatusRow({ label, status, detail }: { label: string; status: string; detail: ReactNode }) {
  return (
    <li style={{ display: "grid", gridTemplateColumns: "8px 1fr auto", gap: 10, alignItems: "center" }}>
      <StatusDot status={statusToDot(status)} />
      <span>{label}</span>
      <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>{detail}</span>
    </li>
  );
}

export function ReconcileStat({
  label,
  predicted,
  actual,
  unit,
  delta,
}: {
  label: string;
  predicted: ReactNode;
  actual: ReactNode;
  unit: string;
  delta: number;
}) {
  const sign = delta >= 0 ? "+" : "";
  const color = Math.abs(delta) > 10 ? "var(--warn)" : "var(--color-secondary)";
  return (
    <article>
      <span className="micro" style={{ marginBottom: 6, display: "block" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{actual}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>{unit}</span>
      </span>
      <span style={{ fontSize: 11, color: "var(--color-text-soft)", marginTop: 2, display: "block" }}>
        was {predicted} &middot; <span style={{ color }}>{sign}{delta.toFixed(1)}%</span>
      </span>
    </article>
  );
}

export function TripCard({
  trip,
  active,
  tripDate,
  routeSubtitle,
  feasibilityLabel,
}: {
  trip: TripSummary;
  active?: boolean;
  tripDate?: { month: string; day: number; year: number };
  routeSubtitle?: string;
  feasibilityLabel?: string;
}) {
  const date = tripDate ?? { month: "May", day: 18, year: 2026 };
  const subtitle = routeSubtitle ?? "Mojave to Atlanta";
  const warning = feasibilityLabel ?? "Tight buffer at Weatherford";

  return (
    <article className={`trip-card ${active ? "active" : ""}`}>
      <section className="trip-date">
        <span className="month">{date.month}</span>
        <span className="day">{date.day}</span>
        <span className="year">{date.year}</span>
      </section>
      <section className="trip-body">
        <h3>
          {trip.name} &mdash; {subtitle}
        </h3>
        <span className="trip-meta">
          <span>
            <b>{trip.totalMiles.toLocaleString()}</b> mi
          </span>
          <span>{trip.driveHours}h drive</span>
          <span>{trip.campNights} camp nights</span>
          <span>
            {trip.workStops} work stops &middot; {trip.meetings} meetings
          </span>
          <span>{trip.crossesTz}</span>
        </span>
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <span className="pill warn">
          <span className="dot" />
          {warning}
        </span>
        <span className="micro">Open planner &rarr;</span>
      </section>
    </article>
  );
}

export function CategoryStack({
  categories,
  total,
  compact,
  showActual,
}: {
  categories: BudgetCategory[];
  total: number;
  compact?: boolean;
  showActual?: boolean;
}) {
  const denom = showActual
    ? Math.max(total, categories.reduce((a, c) => a + (c.actual ?? c.planned), 0))
    : total;
  return (
    <>
      <section className="cat-stack" style={{ marginTop: compact ? 10 : 14 }}>
        {categories
          .filter((c) => (showActual ? (c.actual ?? c.planned) : c.planned) > 0)
          .map((c) => {
            const v = showActual ? (c.actual ?? c.planned) : c.planned;
            const pct = (v / denom) * 100;
            return (
              <span
                key={c.key}
                className={`cat-stack-seg cat-${c.key}`}
                style={{ width: `${pct}%` }}
                title={`${c.label}: $${v.toFixed(2)}`}
              />
            );
          })}
      </section>
      <ul className="cat-list">
        {categories.map((c) => {
          const v = showActual ? (c.actual ?? c.planned) : c.planned;
          if (v === 0 && !showActual) return null;
          const delta =
            showActual && c.planned > 0 ? ((c.actual! - c.planned) / c.planned) * 100 : null;
          return (
            <li key={c.key}>
              <span className={`cat-swatch cat-${c.key}`} />
              <span className="cat-label">{c.label}</span>
              <span className="cat-amt mono">${v.toFixed(showActual ? 2 : 0)}</span>
              {delta !== null ? (
                <span
                  className={`cat-delta ${Math.abs(delta) < 5 ? "ok" : Math.abs(delta) < 15 ? "warn" : "err"}`}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(0)}%
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function TripBurnCard({
  money,
  tripName,
}: {
  money: MoneyData;
  tripName: string;
} & LifestyleNavigateProps) {
  const tb = money.tripBudget;
  const pre = tb.preTripSpend.reduce((a, t) => a + t.amount, 0);
  const prePct = (pre / tb.total) * 100;
  return (
    <article className="card" style={{ padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <section>
          <span className="micro" style={{ marginBottom: 4, display: "block" }}>
            Trip budget &middot; {tripName}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, lineHeight: 1, display: "block" }}>
            ${tb.total.toLocaleString()}
            <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)", marginLeft: 6 }}>USD</span>
          </span>
        </section>
        <span className="pill ok"><span className="dot" />on plan</span>
      </header>

      <CategoryStack categories={tb.categories} total={tb.total} compact />

      <span className="divider" style={{ margin: "12px 0 10px", display: "block" }} />
      <header style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--color-text-soft)" }}>
        <span>Pre-trip spend</span>
        <span className="mono">
          ${pre.toFixed(2)}{" "}
          <span style={{ color: "var(--color-text-faint)" }}>({prePct.toFixed(0)}%)</span>
        </span>
      </header>
      <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", fontSize: 12 }}>
        {tb.preTripSpend.map((t, i) => (
          <li
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 8,
              padding: "4px 0",
              borderTop: "1px dashed var(--color-line)",
            }}
          >
            <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>{t.date}</span>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.merchant}</span>
            <span className="mono">${t.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function SummaryStat({
  label,
  value,
  unit,
  caution,
}: {
  label: string;
  value: ReactNode;
  unit: string;
  caution?: boolean;
}) {
  return (
    <article>
      <span className="micro" style={{ marginBottom: 4, display: "block" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 500,
            color: caution ? "var(--warn)" : "var(--color-text)",
          }}
        >
          {value}
        </span>
        <span className="mono" style={{ fontSize: 12, color: "var(--color-text-soft)" }}>{unit}</span>
      </span>
    </article>
  );
}

export function FeasMetric({
  label,
  value,
  sub,
  warn,
  mono,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  warn?: boolean;
  mono?: boolean;
}) {
  return (
    <article>
      <span className="micro" style={{ marginBottom: 4, display: "block" }}>{label}</span>
      <span
        className={mono ? "mono" : undefined}
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: warn ? "var(--warn)" : "var(--color-text)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          display: "block",
        }}
      >
        {value}
      </span>
      {sub ? (
        <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)", marginTop: 2, display: "block" }}>
          {sub}
        </span>
      ) : null}
    </article>
  );
}

export function ParamRow({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <tr>
      <td style={{ padding: "8px 0", color: "var(--color-text-soft)", borderBottom: "1px dashed var(--color-line)" }}>
        {k}
      </td>
      <td style={{ padding: "8px 0", textAlign: "right", borderBottom: "1px dashed var(--color-line)" }}>{v}</td>
    </tr>
  );
}

export function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="field-row">
      <section>
        <span className="field-label">{label}</span>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </section>
      <section>{children}</section>
    </section>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (next: boolean) => void }) {
  return (
    <span
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    />
  );
}

export function SystemStatus() {
  return (
    <article className="card card-tinted" style={{ padding: 16 }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
        <StatusRow label="vagabond-server" status="ok" detail="0.3.1 &middot; uptime 14d" />
        <StatusRow label="Postgres + PostGIS" status="ok" detail="42 trips &middot; 218 logs" />
        <StatusRow label="Map tiles (PMTiles)" status="ok" detail="CONUS-W &middot; 4.2 GB &middot; built 4d ago" />
        <StatusRow label="Starlink" status="ok" detail="138/12 Mbps" />
        <StatusRow label="Google Calendar" status="ok" detail="Last sync 6m ago" />
        <StatusRow label="Grafana sidecar" status="off" detail="Optional &middot; not running" />
      </ul>
    </article>
  );
}
