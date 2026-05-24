"use client";

import type { ReactNode } from "react";

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function fmtTime(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function compass(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export function seedSpeedHistory() {
  const out: number[] = [];
  for (let i = 0; i < 60; i++) out.push(60 + Math.sin(i / 7) * 6 + (Math.random() - 0.5) * 4);
  return out;
}

export function HeadStat({ label, value, unit }: { label: string; value: ReactNode; unit: string }) {
  return (
    <div className="head-stat">
      <div className="micro">{label}</div>
      <div className="head-stat-value">
        <span className="mono">{value}</span>
        <span className="head-stat-unit">{unit}</span>
      </div>
    </div>
  );
}

export function Kv({ k, v, sub }: { k: string; v: ReactNode; sub?: boolean }) {
  return (
    <div>
      <div className="micro" style={{ marginBottom: 2 }}>
        {k}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: sub ? "var(--color-text-soft)" : "var(--color-text)" }}>
        {v}
      </div>
    </div>
  );
}

export function Gauge({
  label,
  value,
  unit,
  max,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  accent?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="gauge">
      <div className="gauge-label">{label}</div>
      <div className="gauge-value">
        <span className="mono" style={{ color: accent ? "var(--color-primary)" : "var(--color-text)" }}>
          {value}
        </span>
        <span className="gauge-unit">{unit}</span>
      </div>
      <div className="gauge-track">
        <div
          className="gauge-fill"
          style={{ width: `${pct}%`, background: accent ? "var(--color-primary)" : "var(--color-secondary)" }}
        />
      </div>
    </div>
  );
}

export function Bar({
  label,
  value,
  unit,
  sub,
  tone,
  max = 100,
}: {
  label: string;
  value: number;
  unit: string;
  sub: string;
  tone: "primary" | "sage";
  max?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fill = tone === "sage" ? "var(--color-secondary)" : "var(--color-primary)";
  return (
    <div className="bar">
      <div className="bar-head">
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span className="mono" style={{ fontSize: 12 }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: fill }} />
      </div>
      <div className="bar-sub mono">{sub}</div>
    </div>
  );
}

export function SignalRow({
  label,
  detail,
  bars,
  value,
  tone,
}: {
  label: string;
  detail: string;
  bars: number;
  value: string;
  tone: "sage" | "ghost";
}) {
  return (
    <div className="signal-row">
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-soft)" }}>
          {detail}
        </span>
      </div>
      <div className="signal-bars">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`signal-bar ${i < bars ? "on" : ""} ${tone === "ghost" ? "ghost" : ""}`}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)", minWidth: 50, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

export function SpeedSparkline({ values }: { values: number[] }) {
  const w = 268;
  const h = 36;
  const max = 80;
  const min = 50;
  const xs = (i: number) => (i / (values.length - 1)) * w;
  const ys = (v: number) => h - ((v - min) / (max - min)) * h;
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
  const fill = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={fill} fill="var(--color-primary)" opacity="0.15" />
      <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="1.4" />
      <line x1="0" y1={ys(65)} x2={w} y2={ys(65)} stroke="var(--color-text-faint)" strokeDasharray="2 3" strokeWidth="0.8" />
    </svg>
  );
}

export function EventTicker({ now: _now }: { now: Date }) {
  const events = [
    { t: -2, k: "telemetry", msg: "Solar input dipped to 280W — thin cloud overhead." },
    { t: -7, k: "log", msg: "Auto-log: passed Deming, NM (fallback site)." },
    {
      t: -23,
      k: "workstop",
      msg: "Lordsburg work stop completed. Post-buffer slack +34 min — applied to drive plan.",
    },
    { t: -42, k: "calendar", msg: "Quarterly review marked complete in Google Calendar." },
    { t: -68, k: "system", msg: "Starlink stowed for highway. Switched to cellular (Verizon LTE)." },
  ];
  const tone = (k: string) => (k === "workstop" ? "primary" : k === "calendar" ? "sage" : "neutral");

  return (
    <div className="ticker">
      <div className="ticker-head">
        <span className="live-dot" />
        <span className="micro">Event log</span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)", marginLeft: "auto" }}>
          auto-streamed from vagabond-server
        </span>
      </div>
      <div className="ticker-body">
        {events.map((e, i) => (
          <div key={i} className={`ticker-row tone-${tone(e.k)}`}>
            <span className="mono ticker-time">{e.t}m</span>
            <span className="ticker-kind">{e.k}</span>
            <span className="ticker-msg">{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
