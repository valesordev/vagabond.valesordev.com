"use client";

import { useEffect, useMemo, useState } from "react";
import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { VagabondMap } from "../map/VagabondMap";
import type { ConnectivityMode, LifestyleNavigateProps } from "../types";
import { VehicleOverlay } from "./VehicleOverlay";
import {
  Bar,
  clamp,
  compass,
  EventTicker,
  fmtTime,
  Gauge,
  HeadStat,
  Kv,
  seedSpeedHistory,
  SignalRow,
  SpeedSparkline,
} from "./monitor-primitives";

export type MonitorScreenProps = LifestyleNavigateProps & {
  connectivity?: ConnectivityMode;
};

export function MonitorScreen({ connectivity = "online" }: MonitorScreenProps = {}) {
  const D = getVagabondMockData();
  const M = D.money;
  const live = M.live;

  const [progress, setProgress] = useState(0.38);
  const [now, setNow] = useState(new Date(2026, 4, 18, 16, 42));
  const [speedKph, setSpeedKph] = useState(109);
  const [solarW, setSolarW] = useState(412);
  const [history, setHistory] = useState(() => seedSpeedHistory());

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => Math.min(0.95, p + 0.0006));
      setNow((d) => new Date(d.getTime() + 10_000));
      setSpeedKph((s) => clamp(s + (Math.random() - 0.5) * 3.2, 88, 118));
      setSolarW((w) => clamp(w + (Math.random() - 0.5) * 18, 280, 540));
      setHistory((h) => [...h.slice(1), 60 + Math.random() * 14]);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const fromStop = D.stops.find((s) => s.id === "ws-lordsburg")!;
  const toStop = D.stops.find((s) => s.id === "camp-vanhorn")!;

  const vehicle = useMemo(() => {
    const fc = fromStop.coords;
    const tc = toStop.coords;
    const lon = fc[0] + (tc[0] - fc[0]) * progress;
    const lat = fc[1] + (tc[1] - fc[1]) * progress;
    const dx = tc[0] - fc[0];
    const dy = tc[1] - fc[1];
    const headingDeg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    return { coords: [lon, lat] as [number, number], headingDeg };
  }, [progress, fromStop.coords, toStop.coords]);

  const trail = useMemo(() => {
    const fc = fromStop.coords;
    const tc = toStop.coords;
    const pts: [number, number][] = [];
    const start = Math.max(0, progress - 0.3);
    for (let t = start; t <= progress; t += 0.02) {
      pts.push([fc[0] + (tc[0] - fc[0]) * t, fc[1] + (tc[1] - fc[1]) * t]);
    }
    return pts;
  }, [progress, fromStop.coords, toStop.coords]);

  const speedMph = Math.round(speedKph * 0.6214);
  const heading = compass(vehicle.headingDeg);
  const remainingMi = Math.round(327 * (1 - progress));
  const etaMinutes = Math.round((remainingMi / speedMph) * 60);
  const etaTime = new Date(now.getTime() + etaMinutes * 60_000);

  const battSoC = 78;
  const battWatts = -286;
  const waterPct = 64;
  const greyPct = 41;
  const fuelPct = 58;
  const cabinF = 74;
  const outsideF = 91;

  return (
    <>
      <div className="topbar monitor-topbar">
        <div className="topbar-left">
          <div>
            <div className="topbar-crumb">
              <span className="live-dot" /> Live &middot; vehicle <span className="mono">VAN-01</span> &middot;{" "}
              <span className="mono">{fmtTime(now)} MDT</span>
            </div>
            <div className="topbar-title">Real-time monitor</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="monitor-headstats">
            <HeadStat label="Speed" value={speedMph} unit="mph" />
            <HeadStat label="Heading" value={Math.round(vehicle.headingDeg)} unit={`° ${heading}`} />
            <HeadStat label="To camp" value={remainingMi} unit="mi" />
            <HeadStat label="ETA" value={fmtTime(etaTime)} unit="MDT" />
            <HeadStat
              label="$ today"
              value={`$${live.spentToday.toFixed(0)}`}
              unit={`/ $${(live.spentToday + live.remainingDayBudget).toFixed(0)}`}
            />
          </div>
          <button type="button" className="btn-sm ghost">
            Open planner
          </button>
        </div>
      </div>

      <div className="monitor-frame">
        <div className="monitor-map">
          <VagabondMap
            stops={D.stops}
            route={D.routeViaPoints}
            selectedId={null}
            onSelect={() => {}}
            showFallback={false}
          />
          <VehicleOverlay vehicle={vehicle} trail={trail} fromStop={fromStop} toStop={toStop} />

          <div className="map-overlay tl monitor-card">
            <div className="monitor-card-head">
              <span className="micro">Vehicle</span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>
                VAN-01
              </span>
            </div>
            <div className="gauge-row">
              <Gauge label="Speed" value={speedMph} unit="mph" max={85} accent />
              <Gauge label="RPM" value={1850} unit="rpm" max={5000} />
              <Gauge label="Engine °F" value={208} unit="°F" max={260} />
            </div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
              <Kv
                k="Heading"
                v={
                  <>
                    <span className="mono">{Math.round(vehicle.headingDeg)}°</span>{" "}
                    <span style={{ color: "var(--color-text-soft)" }}>{heading}</span>
                  </>
                }
              />
              <Kv k="Alt" v={<span className="mono">3,820 ft</span>} />
              <Kv k="Trip" v={<span className="mono">247.3 mi</span>} />
              <Kv k="Odo" v={<span className="mono">38,914 mi</span>} />
            </div>
          </div>

          <div className="map-overlay tr monitor-card" style={{ minWidth: 256 }}>
            <div className="monitor-card-head">
              <span className="micro">Power &amp; resources</span>
              <span className="mono live-tick">live</span>
            </div>
            <Bar
              label="House battery"
              value={battSoC}
              unit="%"
              sub={`${battWatts > 0 ? "+" : ""}${battWatts} W net`}
              tone="primary"
            />
            <Bar label="Solar input" value={Math.round(solarW)} unit="W" sub="3 of 4 panels nominal" tone="sage" max={600} />
            <Bar label="Fresh water" value={waterPct} unit="%" sub="32 gal capacity" tone="primary" />
            <Bar label="Grey water" value={greyPct} unit="%" sub="dump at Van Horn" tone="sage" />
            <Bar label="Fuel" value={fuelPct} unit="%" sub="range ~ 312 mi" tone="primary" />
          </div>

          <div className="map-overlay bl monitor-card" style={{ minWidth: 300 }}>
            <div className="monitor-card-head">
              <span className="micro">Up next &middot; Day 1 overnight</span>
              <span className="pill ok">
                <span className="dot" />
                on schedule
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{toStop.name}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                {toStop.loc.split(" — ")[0]}
              </div>
            </div>
            <div className="next-stop-row">
              <Kv
                k="ETA"
                v={
                  <>
                    <span className="mono">{fmtTime(etaTime)}</span>{" "}
                    <span style={{ color: "var(--color-text-soft)", fontSize: 11 }}>MDT</span>
                  </>
                }
              />
              <Kv k="Distance" v={<span className="mono">{remainingMi} mi</span>} />
              <Kv
                k="Drive"
                v={
                  <span className="mono">
                    {Math.floor(etaMinutes / 60)}h {etaMinutes % 60}m
                  </span>
                }
              />
              <Kv k="Arrive" v={<span className="mono">~daylight</span>} sub />
            </div>
            <div className="divider" />
            <SpeedSparkline values={history} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--color-text-faint)",
                marginTop: 4,
              }}
            >
              <span className="mono">−60 min</span>
              <span className="mono">avg {Math.round(history.reduce((a, b) => a + b, 0) / history.length)} mph</span>
              <span className="mono">now</span>
            </div>
          </div>

          <div className="map-overlay bl2 monitor-card monitor-card-money" style={{ minWidth: 280, maxWidth: 320 }}>
            <div className="monitor-card-head">
              <span className="micro">Day spend &middot; Day {live.day}</span>
              <span className="mono live-tick">live</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500 }}>
                ${live.spentToday.toFixed(2)}
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                ${live.remainingDayBudget.toFixed(2)} left of $
                {(live.spentToday + live.remainingDayBudget).toFixed(0)}
              </span>
            </div>
            <div className="budget-meter" style={{ height: 6, margin: "0 0 10px" }}>
              <div
                className="budget-meter-fill"
                style={{
                  width: `${(live.spentToday / (live.spentToday + live.remainingDayBudget)) * 100}%`,
                }}
              />
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
              {live.todayCharges
                .slice(-3)
                .reverse()
                .map((c, i) => (
                  <li
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto auto",
                      gap: 8,
                      padding: "4px 0",
                      borderTop: i === 0 ? "none" : "1px dashed var(--color-line)",
                      alignItems: "baseline",
                    }}
                  >
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>
                      {c.time.split(" ")[0]}
                    </span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.merchant}
                    </span>
                    <span className={`cat-swatch cat-${c.category}`} title={c.category} />
                    <span className="mono" style={{ fontWeight: 600 }}>
                      ${c.amount.toFixed(2)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="map-overlay br monitor-card" style={{ minWidth: 240 }}>
            <div className="monitor-card-head">
              <span className="micro">Connectivity</span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--color-text-faint)" }}>
                {connectivity}
              </span>
            </div>
            <SignalRow label="Cellular" detail="Verizon LTE" bars={3} value="−86 dBm" tone="sage" />
            <SignalRow label="Starlink" detail="standby" bars={0} value="—" tone="ghost" />
            <SignalRow label="Local LAN" detail="vagabond-server" bars={4} value="OK" tone="sage" />
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Kv k="Cabin" v={<span className="mono">{cabinF}°F</span>} />
              <Kv k="Outside" v={<span className="mono">{outsideF}°F</span>} />
              <Kv k="Humidity" v={<span className="mono">18%</span>} />
              <Kv k="Wind" v={<span className="mono">SW 14</span>} />
            </div>
          </div>
        </div>

        <EventTicker now={now} />
      </div>
    </>
  );
}
