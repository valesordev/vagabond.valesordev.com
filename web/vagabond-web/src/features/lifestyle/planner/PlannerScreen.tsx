"use client";

import { useState } from "react";
import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import type { LifestyleNavigateProps } from "../types";
import { PlannerDataDominant } from "./PlannerDataDominant";

export function PlannerScreen(_props: LifestyleNavigateProps = {}) {
  const D = getVagabondMockData();
  const [selected, setSelected] = useState("ws-lordsburg");

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <div className="topbar-crumb">Trip &middot; GA-PICKUP-26 &middot; Confirmed</div>
            <div className="topbar-title">
              GA Pickup &mdash; {D.trip.window}
            </div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="pill warn">
            <span className="dot" />1 stop needs attention
          </span>
          <button type="button" className="btn-sm ghost">
            Open in monitor
          </button>
          <button type="button" className="btn-sm sage">
            Sync to calendar
          </button>
        </div>
      </div>

      <PlannerDataDominant
        stops={D.stops}
        route={D.routeViaPoints}
        selectedId={selected}
        setSelected={setSelected}
      />
    </>
  );
}
