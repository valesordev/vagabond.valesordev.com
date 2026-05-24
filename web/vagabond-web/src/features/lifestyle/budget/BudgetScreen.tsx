"use client";

import { useMemo, useState } from "react";
import { getVagabondMockData, type PowerLoad } from "@/lib/mock/vagabond-data";
import type { LifestyleNavigateProps } from "../types";
import { BudgetSpreadsheet } from "./BudgetSpreadsheet";
import { BudgetVisual } from "./BudgetVisual";

export function BudgetScreen(_props: LifestyleNavigateProps = {}) {
  const D = getVagabondMockData();
  const [variant, setVariant] = useState<"map" | "data">("map");
  const isMap = variant === "map";

  const [loads, setLoads] = useState<PowerLoad[]>(() => D.powerLoads.map((l) => ({ ...l })));
  const [psh, setPsh] = useState(D.solar.peakSunHours);
  const [waterRate, setWaterRate] = useState(D.waterBudget.consumptionPerDay);

  const totals = useMemo(() => {
    const consumed = loads.reduce((a, l) => a + l.watts * l.hours, 0);
    const produced = D.solar.panels * D.solar.peakWatts * psh;
    const net = produced - consumed;
    const reserve = D.battery.capacityWh + net * 3;
    return { consumed, produced, net, reserve };
  }, [loads, psh, D.solar.panels, D.solar.peakWatts, D.battery.capacityWh]);

  const updateLoad = (i: number, field: "watts" | "hours", value: string) => {
    const next = loads.slice();
    next[i] = { ...next[i], [field]: Number(value) };
    setLoads(next);
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <div className="topbar-crumb">Trip &middot; GA-PICKUP-26 &middot; Budget</div>
            <div className="topbar-title">Power, water, food &amp; money</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="pill ok">
            <span className="dot" />
            Within reserves
          </span>
          <div className="segment">
            <button type="button" className={isMap ? "active" : ""} onClick={() => setVariant("map")}>
              Visual
            </button>
            <button type="button" className={!isMap ? "active" : ""} onClick={() => setVariant("data")}>
              Spreadsheet
            </button>
          </div>
          <button type="button" className="btn-sm sage">
            Save defaults
          </button>
        </div>
      </div>

      <div className="page">
        {isMap ? (
          <BudgetVisual
            totals={totals}
            loads={loads}
            updateLoad={updateLoad}
            psh={psh}
            setPsh={setPsh}
            waterRate={waterRate}
            setWaterRate={setWaterRate}
          />
        ) : (
          <BudgetSpreadsheet
            totals={totals}
            loads={loads}
            updateLoad={updateLoad}
            psh={psh}
            setPsh={setPsh}
            waterRate={waterRate}
            setWaterRate={setWaterRate}
          />
        )}
      </div>
    </>
  );
}
