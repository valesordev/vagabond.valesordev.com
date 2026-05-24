"use client";

import { getVagabondMockData, type Meeting, type Stop } from "@/lib/mock/vagabond-data";
import { useLifestyleNavigate } from "../navigation";
import { BigStat, FactRow, SectionHead } from "../primitives";
import type { LifestyleNavigateProps } from "../types";

type TimelineKind = "depart" | "drive" | "work" | "camp" | "arrive";

type TimelineRowData = {
  kind: TimelineKind;
  time: string;
  date?: string;
  title?: string;
  loc?: string;
  body?: string;
  meetings?: Meeting[];
  feasible?: Stop["feasible"];
};

function TimelineRow({ row }: { row: TimelineRowData }) {
  const colors: Record<TimelineKind, { dot: string; label: string }> = {
    depart: { dot: "var(--color-secondary)", label: "Depart" },
    drive: { dot: "var(--color-text-faint)", label: "Drive" },
    work: { dot: "var(--color-primary)", label: "Work stop" },
    camp: { dot: "var(--color-secondary)", label: "Camp night" },
    arrive: { dot: "var(--color-secondary)", label: "Arrive" },
  };
  const c = colors[row.kind];
  return (
    <div className="tl-row">
      <div className="tl-time">
        <span className="big">{row.time}</span>
        {row.date && <span>{row.date}</span>}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
          <span className="micro">{c.label}</span>
          {row.feasible === "warn" && (
            <span className="pill warn">
              <span className="dot" />
              Tight buffer
            </span>
          )}
        </div>
        {row.title && <div style={{ fontWeight: 600, fontSize: 14.5 }}>{row.title}</div>}
        {row.loc && <div style={{ fontSize: 12.5, color: "var(--color-text-soft)", marginTop: 2 }}>{row.loc}</div>}
        {row.body && <div style={{ fontSize: 12.5, color: "var(--color-text-soft)", marginTop: 4 }}>{row.body}</div>}
        {row.meetings && (
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 4 }}>
            {row.meetings.map((m) => (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 12.5,
                  padding: "4px 0",
                  borderTop: "1px dashed var(--color-line)",
                }}
              >
                <span style={{ fontWeight: 500 }}>{m.title}</span>
                <span className="mono" style={{ color: "var(--color-text-soft)" }}>
                  {m.homeTime} &middot; {m.duration}m &middot; {m.connectivity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function TripDetailScreen({ onNavigate }: LifestyleNavigateProps = {}) {
  const goto = useLifestyleNavigate({ onNavigate });
  const D = getVagabondMockData();
  const trip = D.trip;
  const M = D.money;

  const timeline: TimelineRowData[] = [];
  D.stops.forEach((s) => {
    if (s.kind === "origin") {
      timeline.push({
        kind: "depart",
        time: "06:30 PDT",
        date: "Mon May 18",
        title: "Depart Mojave preserve",
        body: "Pre-checks complete. Fuel topped at Baker.",
      });
      timeline.push({
        kind: "drive",
        time: "06:30 → 09:18",
        body: "Drive: I-15 S → I-10 E. Est. 612 mi, 9h 24m.",
      });
    }
    if (s.kind === "workstop") {
      timeline.push({
        kind: "work",
        time: s.arrival ?? "",
        date: s.day === 1 ? "Mon May 18" : "Tue May 19",
        title: s.name,
        loc: s.loc,
        meetings: s.meetings,
        feasible: s.feasible,
      });
    }
    if (s.kind === "camp") {
      timeline.push({
        kind: "camp",
        time: s.arrival ?? "",
        date: s.day === 1 ? "Mon May 18" : "Tue May 19",
        title: s.name,
        loc: s.loc,
      });
    }
    if (s.kind === "destination") {
      timeline.push({
        kind: "drive",
        time: "07:00 → 15:18",
        body: "Drive: I-20 E into Atlanta. Est. 549 mi, 8h 18m.",
      });
      timeline.push({
        kind: "arrive",
        time: "15:18 EDT",
        date: "Wed May 20",
        title: "Arrive Atlanta",
        body: "Pickup destination reached. Total: 1,819 mi · 27h 48m drive time.",
      });
    }
  });

  return (
    <div className="page page-narrow">
      <div className="detail-hero">
        <div>
          <div className="micro">
            {trip.status} &middot; {trip.window}
          </div>
          <h1>{trip.name} &mdash; Mojave to Atlanta</h1>
          <p className="lede">
            Three days of working drives. Two camp nights. Three meeting blocks anchored to PDT while the truck crosses
            to Eastern. Two pre-identified fallback stops in case the primary parking won&rsquo;t work.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="button" className="btn-sm sage">
              Sync to calendar
            </button>
            <button type="button" className="btn-sm ghost">
              Export GPX
            </button>
            <button type="button" className="btn-sm ghost">
              Download .ics
            </button>
            <button type="button" className="btn-sm ghost" onClick={() => goto("planner")}>
              Open in planner
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto auto", gap: 24, alignContent: "start" }}>
          <BigStat label="Distance" value={trip.totalMiles.toLocaleString()} unit="mi" />
          <BigStat label="Drive" value={trip.driveHours} unit="h" />
          <BigStat label="Camp nights" value={trip.campNights} unit="" />
          <BigStat label="Meetings" value={trip.meetings} unit="" />
          <BigStat label="Budget" value={`$${M.tripBudget.total}`} unit="USD" />
          <BigStat label="YTD trips" value={M.ytd.tripsCompleted} unit="" />
        </div>
      </div>

      <div className="detail-grid">
        <section>
          <SectionHead title="Timeline" right="3 days" />
          <div className="timeline">
            {timeline.map((row, i) => (
              <TimelineRow key={i} row={row} />
            ))}
          </div>
        </section>
        <aside>
          <div className="card" style={{ padding: 18 }}>
            <div className="micro" style={{ marginBottom: 6 }}>
              Trip facts
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: 13,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <FactRow k="Trip ID" v={<span className="mono">ga-pickup-26</span>} />
              <FactRow k="Window" v={trip.window} />
              <FactRow k="Origin" v={trip.origin} />
              <FactRow k="Destination" v={trip.destination} />
              <FactRow k="Home TZ" v={trip.homeTz} />
              <FactRow
                k="TZ drift"
                v={<span style={{ color: "var(--warn)" }}>{trip.crossesTz}</span>}
              />
              <FactRow
                k="Status"
                v={
                  <span className="pill ok">
                    <span className="dot" />
                    {trip.status}
                  </span>
                }
              />
            </ul>
          </div>

          <div className="card card-accent" style={{ marginTop: 14, padding: 18 }}>
            <div className="micro" style={{ marginBottom: 6, color: "#4a3a26" }}>
              Budget snapshot
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: 13,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <FactRow k="Money planned" v={<span className="mono">${M.tripBudget.total} USD</span>} />
              <FactRow
                k="Pre-trip spend"
                v={
                  <span className="mono">
                    ${M.tripBudget.preTripSpend.reduce((a, t) => a + t.amount, 0).toFixed(2)}
                  </span>
                }
              />
              <FactRow k="Power reserve" v={<span className="mono">1,844 / 3,072 Wh</span>} />
              <FactRow k="Water end" v={<span className="mono">10.8 / 18 gal</span>} />
              <FactRow k="Meals planned" v={<span className="mono">9 / 9</span>} />
            </ul>
            <button type="button" className="btn-sm ghost" style={{ marginTop: 12, width: "100%" }}>
              Edit budgets
            </button>
          </div>

          <div className="card" style={{ marginTop: 14, padding: 18 }}>
            <div className="micro" style={{ marginBottom: 6 }}>
              Field logging
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-soft)" }}>
              Daily log entries unlock once the trip starts. Logs sync over Starlink at camp.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: 12.5, color: "var(--color-text-soft)" }}>
              <li style={{ padding: "6px 0", borderBottom: "1px dashed var(--color-line)" }}>
                Day 1 log &middot; <span className="micro">Pending</span>
              </li>
              <li style={{ padding: "6px 0", borderBottom: "1px dashed var(--color-line)" }}>
                Day 2 log &middot; <span className="micro">Pending</span>
              </li>
              <li style={{ padding: "6px 0" }}>
                Day 3 log &middot; <span className="micro">Pending</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
