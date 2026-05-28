import type { Stop, VagabondMockData } from "@/lib/mock/vagabond-data";

/** Compact trip snapshot for the planner assistant (matches design prototype). */
export function buildTripContext(
  data: Pick<VagabondMockData, "trip" | "money">,
  stops: Stop[],
  selectedId: string,
): string {
  const t = data.trip;
  const tb = data.money.tripBudget;
  const tripDays = tb.perDay.length;
  const lines: string[] = [];

  lines.push(`Trip: ${t.name} (${t.id}) — ${t.window}`);
  lines.push(
    `Route: ${t.totalMiles} mi, ${t.driveHours}h drive over ${tripDays} days; crosses ${t.crossesTz}.`,
  );
  lines.push("");
  lines.push("Stops:");
  stops.forEach((s) => {
    const meet = s.meetings
      ? ` — meetings: ${s.meetings.map((m) => `${m.title} ${m.homeTime} (${m.duration}m, ${m.connectivity})`).join("; ")}`
      : "";
    const buf =
      s.preBufferMargin != null
        ? ` — slack pre +${s.preBufferMargin}m / post +${s.postBufferMargin}m (${s.feasible})`
        : "";
    const fb = s.fallback ? ` — fallback: ${s.fallback.name} (${s.fallback.note})` : "";
    lines.push(
      `- [${s.kind}] ${s.name} @ ${s.loc}${s.arrival ? ` — arr ${s.arrival}, dep ${s.departure || ""}` : ""}${meet}${buf}${fb}`,
    );
  });
  lines.push("");
  lines.push(`Currently selected stop: ${selectedId}`);
  lines.push("");
  lines.push(`Monetary budget: $${tb.total} planned over ${tripDays} days (currency: ${data.money.currency}).`);
  lines.push(
    `By category: ${tb.categories
      .filter((c) => c.planned > 0)
      .map((c) => `${c.label} $${c.planned}`)
      .join(", ")}.`,
  );
  lines.push(
    `Pre-trip spend already on card: $${tb.preTripSpend.reduce((a, tx) => a + tx.amount, 0).toFixed(2)} (${tb.preTripSpend.length} charges).`,
  );

  return lines.join("\n");
}
