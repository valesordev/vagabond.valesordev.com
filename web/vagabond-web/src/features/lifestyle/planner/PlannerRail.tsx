"use client";

import { useState } from "react";
import { getVagabondMockData, type Stop } from "@/lib/mock/vagabond-data";
import { PlannerAssistant } from "./PlannerAssistant";
import { ScheduleBlock } from "./ScheduleBlock";

export function PlannerRail({
  stops,
  selectedId,
  setSelected,
}: {
  stops: Stop[];
  selectedId: string;
  setSelected: (id: string) => void;
}) {
  const D = getVagabondMockData();
  const [tab, setTab] = useState<"schedule" | "assistant">("schedule");

  return (
    <aside className="planner-rail">
      <div className="rail-header" style={{ padding: "16px 20px 0" }}>
        <div className="rail-tabs">
          <button type="button" className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}>
            Schedule
          </button>
          <button type="button" className={tab === "assistant" ? "active" : ""} onClick={() => setTab("assistant")}>
            Assistant <span className="rail-tab-badge">AI</span>
          </button>
        </div>
      </div>

      {tab === "schedule" && (
        <>
          <div style={{ padding: "16px 20px 8px" }}>
            <div className="micro" style={{ marginBottom: 4 }}>
              Schedule constraints
            </div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>
              Meetings driving the route
            </h2>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            {D.stops
              .filter((s) => s.kind === "workstop")
              .map((ws) => (
                <ScheduleBlock
                  key={ws.id}
                  ws={ws}
                  selected={ws.id === selectedId}
                  onClick={() => setSelected(ws.id)}
                />
              ))}
            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: "var(--color-bg-lift)",
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              <div className="micro" style={{ marginBottom: 4 }}>
                About meeting feasibility
              </div>
              <p style={{ margin: 0, color: "var(--color-text-soft)", lineHeight: 1.5 }}>
                All meeting times are anchored to your home zone (PDT). The system resolves local time from each
                stop&apos;s coordinates and validates that{" "}
                <span className="mono">arrival + pre-buffer &le; meeting start</span>.
              </p>
            </div>
          </div>
        </>
      )}

      {tab === "assistant" && (
        <PlannerAssistant stops={stops} selectedId={selectedId} setSelected={setSelected} />
      )}
    </aside>
  );
}
