"use client";

import { useMemo, useState } from "react";

import { getVagabondMockData, type PowerLoad } from "@/lib/mock/vagabond-data";
import { SimpleTopbar } from "../primitives";
import type { LifestyleNavigateProps } from "../types";
import { BudgetSpreadsheet } from "./BudgetSpreadsheet";
import { BudgetVisual } from "./BudgetVisual";

export type BudgetTotals = {
  consumed: number;
  produced: number;
  net: number;
  reserve: number;
};

export type BudgetEditorProps = {
  totals: BudgetTotals;
  loads: PowerLoad[];
  updateLoad: (i: number, field: "watts" | "hours", value: string) => void;
  psh: number;
  setPsh: (v: number) => void;
  waterRate: number;
  setWaterRate: (v: number) => void;
  tripDays: number;
};

export function BudgetScreen(_props: LifestyleNavigateProps = {}) {
  const D = getVagabondMockData();
  const tripDays = D.waterBudget.tripDays ?? D.days.length;
  const [variant, setVariant] = useState<"visual" | "spreadsheet">("visual");
  const isVisual = variant === "visual";

  const [loads, setLoads] = useState<PowerLoad[]>(() => D.powerLoads.map((l) => ({ ...l })));
  const [psh, setPsh] = useState(D.solar.peakSunHours);
  const [waterRate, setWaterRate] = useState(D.waterBudget.consumptionPerDay);

  const totals = useMemo(() => {
    const consumed = loads.reduce((a, l) => a + l.watts * l.hours, 0);
    const produced = D.solar.panels * D.solar.peakWatts * psh;
    const net = produced - consumed;
    const reserve = D.battery.capacityWh + net * tripDays;
    return { consumed, produced, net, reserve };
  }, [loads, psh, D.solar.panels, D.solar.peakWatts, D.battery.capacityWh, tripDays]);

  const updateLoad = (i: number, field: "watts" | "hours", value: string) => {
    const next = loads.slice();
    next[i] = { ...next[i], [field]: Number(value) };
    setLoads(next);
  };

  const editorProps: BudgetEditorProps = {
    totals,
    loads,
    updateLoad,
    psh,
    setPsh,
    waterRate,
    setWaterRate,
    tripDays,
  };

  const tripCode = D.trip.id.toUpperCase();

  return (
    <>
      <SimpleTopbar crumb={`Trip · ${tripCode} · Budget`} title="Power, water, food & money">
        <span className="pill ok">
          <span className="dot" />
          Within reserves
        </span>
        <div className="segment">
          <button type="button" className={isVisual ? "active" : ""} onClick={() => setVariant("visual")}>
            Visual
          </button>
          <button type="button" className={!isVisual ? "active" : ""} onClick={() => setVariant("spreadsheet")}>
            Spreadsheet
          </button>
        </div>
        <button type="button" className="btn-sm sage">
          Save defaults
        </button>
      </SimpleTopbar>

      <div className="page">
        {isVisual ? <BudgetVisual {...editorProps} /> : <BudgetSpreadsheet {...editorProps} />}
      </div>
    </>
  );
}
