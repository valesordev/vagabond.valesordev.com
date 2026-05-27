"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getVagabondMockData } from "@/lib/mock/vagabond-data";
import { SimpleTopbar } from "../primitives";
import type { LifestyleNavigateProps } from "../types";
import { PlannerDataDominant } from "./PlannerDataDominant";

export function PlannerScreen(_props: LifestyleNavigateProps = {}) {
  const D = getVagabondMockData();
  const [selected, setSelected] = useState("ws-lordsburg");

  const attentionCount = useMemo(
    () => D.stops.filter((s) => s.feasible === "warn").length,
    [D.stops],
  );

  const tripCode = D.trip.id.toUpperCase();

  return (
    <>
      <SimpleTopbar
        crumb={`Trip · ${tripCode} · ${D.trip.status}`}
        title={`${D.trip.name} — ${D.trip.window}`}
      >
        {attentionCount > 0 && (
          <span className="pill warn">
            <span className="dot" />
            {attentionCount} stop{attentionCount === 1 ? "" : "s"} needs attention
          </span>
        )}
        <Link href="/lifestyle/monitor" className="btn-sm ghost">
          Open in monitor
        </Link>
        <button type="button" className="btn-sm sage">
          Sync to calendar
        </button>
      </SimpleTopbar>

      <PlannerDataDominant
        stops={D.stops}
        route={D.routeViaPoints}
        selectedId={selected}
        setSelected={setSelected}
      />
    </>
  );
}
