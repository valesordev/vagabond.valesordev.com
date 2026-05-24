"use client";

import { getVagabondMockData, type Stop } from "@/lib/mock/vagabond-data";

export function VehicleOverlay({
  vehicle,
  trail,
  toStop,
}: {
  vehicle: { coords: [number, number]; headingDeg: number };
  trail: [number, number][];
  fromStop: Stop;
  toStop: Stop;
}) {
  const D = getVagabondMockData();
  const trailPath =
    trail.length > 1
      ? trail
          .map((p, i) => {
            const xy = D.project(p[0], p[1]);
            return `${i === 0 ? "M" : "L"} ${xy.x.toFixed(1)} ${xy.y.toFixed(1)}`;
          })
          .join(" ")
      : "";

  const v = D.project(vehicle.coords[0], vehicle.coords[1]);
  const dest = D.project(toStop.coords[0], toStop.coords[1]);

  return (
    <svg className="monitor-overlay-svg" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice">
      <path d={trailPath} stroke="var(--color-primary)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
      <line
        x1={v.x}
        y1={v.y}
        x2={dest.x}
        y2={dest.y}
        stroke="var(--color-primary)"
        strokeWidth="2.2"
        strokeDasharray="6 5"
        opacity="0.55"
      />
      <circle cx={v.x} cy={v.y} r="18" fill="none" stroke="var(--color-primary)" strokeWidth="1" opacity="0.45">
        <animate attributeName="r" from="14" to="38" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.55" to="0" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={v.x} cy={v.y} r="14" fill="none" stroke="var(--color-primary)" strokeWidth="1.2" opacity="0.65">
        <animate attributeName="r" from="10" to="28" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.45" to="0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
      </circle>

      <g transform={`translate(${v.x.toFixed(1)} ${v.y.toFixed(1)}) rotate(${vehicle.headingDeg.toFixed(1)})`}>
        <circle r="11" fill="var(--color-bg)" stroke="var(--color-primary)" strokeWidth="2" />
        <path d="M 0 -7 L 5 5 L 0 2 L -5 5 Z" fill="var(--color-primary)" />
      </g>

      <g transform={`translate(${(v.x + 16).toFixed(1)} ${(v.y - 10).toFixed(1)})`}>
        <rect x="0" y="-9" width="74" height="18" rx="3" fill="#fbf6ef" stroke="#d9986f88" />
        <text
          x="6"
          y="3"
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          fill="var(--color-text)"
          letterSpacing="0.1em"
        >
          VAN-01 · MOVING
        </text>
      </g>
    </svg>
  );
}
