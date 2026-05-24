"use client";

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
      <div className="day-head">
        <div>
          <div className="day-num">
            Day {day.num} &middot; <span className="day-date">{day.date}</span>
          </div>
          <div className="day-title">{day.title}</div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)", textAlign: "right" }}>
          {day.miles} mi<br />
          {day.hours}h
        </div>
      </div>
      {stops.map((s) => (
        <StopItem key={s.id} stop={s} selected={s.id === selectedId} onClick={() => setSelected(s.id)} />
      ))}
    </div>
  );
}
