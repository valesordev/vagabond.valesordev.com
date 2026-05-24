#!/usr/bin/env python3
"""Generate remaining lifestyle feature TSX screen components."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "features" / "lifestyle"


def w(rel: str, content: str) -> None:
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"wrote {rel}")


def main() -> None:
    # --- planner subcomponents ---
    w("planner/DayBlock.tsx", '''"use client";

import type { Stop, TripDay } from "@/lib/mock/vagabond-data";
import { StopItem } from "./StopItem";

export function DayBlock({
  day,
  stops,
  selectedId,
  setSelected,
}: {
  day: TripDay;
  stops: Stop[];
  selectedId: string;
  setSelected: (id: string) => void;
}) {
  return (
    <motion className="day-block">
      <div className="day-head">
        <div>
          <motion className="day-num">Day {day.num} &middot; <span className="day-date">{day.date}</span></motion>
          <motion className="day-title">{day.title}</motion>
        </div>
        <motion className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)", textAlign: "right" }}>
          {day.miles} mi<br />{day.hours}h
        </motion>
      </div>
      {stops.map((s) => (
        <StopItem key={s.id} stop={s} selected={s.id === selectedId} onClick={() => setSelected(s.id)} />
      ))}
    </motion>
  );
}'''.replace("<motion", "<motion").replace("</motion>", "</div>").replace('className="day-block"', 'className="day-block"').replace("<motion className", "<motion className"))

    # Fix the botched replace - rewrite DayBlock properly
    w("planner/DayBlock.tsx", '''"use client";

import type { Stop, TripDay } from "@/lib/mock/vagabond-data";
import { StopItem } from "./StopItem";

export function DayBlock({
  day,
  stops,
  selectedId,
  setSelected,
}: {
  day: TripDay;
  stops: Stop[];
  selectedId: string;
  setSelected: (id: string) => void;
}) {
  return (
    <div className="day-block">
      <motion className="day-head">
        <div>
          <div className="day-num">Day {day.num} &middot; <span className="day-date">{day.date}</span></div>
          <div className="day-title">{day.title}</motion>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)", textAlign: "right" }}>
          {day.miles} mi<br />{day.hours}h
        </div>
      </div>
      {stops.map((s) => (
        <StopItem key={s.id} stop={s} selected={s.id === selectedId} onClick={() => setSelected(s.id)} />
      ))}
    </div>
  );
}''')

    print("partial - continuing in direct writes")

if __name__ == "__main__":
    main()
