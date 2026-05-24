"use client";

import type { Stop } from "@/lib/mock/vagabond-data";
import { FeasMetric } from "../primitives";

export function FeasibilityPanel({ stop }: { stop: Stop }) {
  const meetings = stop.meetings ?? [];
  const last = meetings[meetings.length - 1];

  const lastMeetingEnd = (() => {
    if (!last) return "—";
    const [h, m] = last.homeTime.split(" ")[0].split(":").map(Number);
    const tot = h * 60 + m + last.duration;
    return `${String(Math.floor(tot / 60) % 24).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")} ${last.homeTime.split(" ")[1]}`;
  })();

  return (
    <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
      <FeasMetric label="Arrival ETA" value={stop.arrival} mono />
      <FeasMetric label="Pre-buffer required" value={`${stop.preBuffer} min`} />
      <FeasMetric
        label="Pre-buffer slack"
        value={`+${stop.preBufferMargin} min`}
        warn={(stop.preBufferMargin ?? 0) < 15}
      />
      <FeasMetric
        label="First meeting"
        value={meetings[0]?.homeTime ?? "—"}
        sub={meetings[0] ? `${meetings[0].localTime} local` : undefined}
      />

      <FeasMetric label="Last meeting end" value={lastMeetingEnd} />
      <FeasMetric label="Post-buffer required" value={`${stop.postBuffer} min`} />
      <FeasMetric
        label="Post-buffer slack"
        value={`+${stop.postBufferMargin} min`}
        warn={(stop.postBufferMargin ?? 0) < 15}
      />
      <FeasMetric
        label="Connectivity"
        value={stop.connectivity === "starlink" ? "Starlink" : "Cellular OK"}
        sub={stop.connectivity === "starlink" ? "Open sky needed" : "—"}
      />
    </div>
  );
}
