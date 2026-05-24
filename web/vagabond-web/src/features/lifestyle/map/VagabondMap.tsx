"use client";

import { useMemo } from "react";
import { getVagabondMockData, type Stop } from "@/lib/mock/vagabond-data";

export type VagabondMapProps = {
  stops: Stop[];
  route: [number, number][];
  selectedId: string | null;
  onSelect?: (id: string) => void;
  showFallback?: boolean;
  mode?: "wide";
};

export function VagabondMap({
  stops,
  route,
  selectedId,
  onSelect,
  showFallback = true,
}: VagabondMapProps) {
  const D = getVagabondMockData();

  const routePath = useMemo(() => {
    const pts = route.map(([lng, lat]) => D.project(lng, lat));
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      d += ` Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    }
    d += ` T ${pts[pts.length - 1].x.toFixed(1)} ${pts[pts.length - 1].y.toFixed(1)}`;
    return d;
  }, [route, D]);

  const contours = useMemo(() => {
    const lines: { cx: number; cy: number; rx: number; ry: number; rot: number }[] = [];
    const seed = (n: number) => (Math.sin(n * 12.9898) * 43758.5453) % 1;
    for (let i = 0; i < 30; i++) {
      lines.push({
        cx: 100 + Math.abs(seed(i + 1)) * 1000,
        cy: 80 + Math.abs(seed(i + 17)) * 480,
        rx: 60 + Math.abs(seed(i + 31)) * 180,
        ry: 40 + Math.abs(seed(i + 53)) * 120,
        rot: seed(i + 7) * 60,
      });
    }
    return lines;
  }, []);

  const roads = useMemo(
    () =>
      [
        [
          [-120, 33.8],
          [-116, 34],
          [-112, 32.5],
          [-108, 32.3],
          [-104, 31],
          [-98, 30],
          [-92, 30.4],
          [-86, 30.5],
          [-82, 30.3],
        ],
        [
          [-106, 32],
          [-100, 32.5],
          [-94, 32.7],
          [-88, 32.4],
          [-84, 33],
        ],
        [
          [-118, 35],
          [-112, 35.2],
          [-107, 35.1],
          [-102, 35.2],
          [-97, 35.5],
          [-90, 35.1],
          [-85, 35.9],
        ],
        [
          [-106, 38],
          [-106, 31.7],
        ],
        [
          [-97.5, 37.5],
          [-97.5, 30],
        ],
        [
          [-90.2, 37],
          [-90.2, 30],
        ],
      ] as [number, number][][],
    [],
  );

  const stateOutlines = useMemo(
    () =>
      [
        [
          [-114.6, 38],
          [-114.6, 32.5],
        ],
        [
          [-109.05, 37],
          [-109.05, 31.3],
        ],
        [
          [-103.05, 36.5],
          [-103.05, 32],
          [-106.6, 32],
          [-106.6, 31.8],
        ],
        [
          [-103, 36.5],
          [-100, 36.5],
          [-100, 34.5],
          [-94.5, 33.5],
        ],
        [
          [-94, 33.5],
          [-94, 29.5],
        ],
        [
          [-91.5, 33],
          [-91.5, 30.2],
        ],
        [
          [-88.5, 35],
          [-88.5, 30.2],
        ],
        [
          [-85, 35],
          [-85, 30.5],
        ],
      ] as [number, number][][],
    [],
  );

  const stateLabels = [
    { x: -114, y: 35, t: "CA" },
    { x: -111.5, y: 34.5, t: "AZ" },
    { x: -106, y: 34.5, t: "NM" },
    { x: -99, y: 33.5, t: "TX" },
    { x: -92.5, y: 32, t: "LA" },
    { x: -89.7, y: 33, t: "MS" },
    { x: -86.7, y: 33, t: "AL" },
    { x: -83.4, y: 33, t: "GA" },
  ];

  const showStop = (s: Stop) => onSelect?.(s.id);

  const driveSegments = [
    { from: stops[0], to: stops[1], label: "612 mi · 9h 24m" },
    { from: stops[2], to: stops[3], label: "658 mi · 10h 06m" },
    { from: stops[4], to: stops[5], label: "549 mi · 8h 18m" },
  ];

  return (
    <svg
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <pattern id="paper-grain" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="var(--map-bg)" />
          <circle cx="20" cy="40" r="0.6" fill="#c8a884" opacity="0.18" />
          <circle cx="85" cy="20" r="0.5" fill="#c8a884" opacity="0.14" />
          <circle cx="60" cy="95" r="0.7" fill="#c8a884" opacity="0.16" />
          <circle cx="40" cy="70" r="0.4" fill="#c8a884" opacity="0.12" />
        </pattern>
      </defs>

      <rect width="1200" height="640" fill="url(#paper-grain)" />

      <g opacity="0.55" stroke="var(--map-contour)" strokeWidth="0.7" fill="none">
        {contours.map((c, i) => (
          <ellipse
            key={i}
            cx={c.cx}
            cy={c.cy}
            rx={c.rx}
            ry={c.ry}
            transform={`rotate(${c.rot} ${c.cx} ${c.cy})`}
            strokeDasharray={i % 3 === 0 ? "0" : "3 4"}
          />
        ))}
      </g>

      <g stroke="var(--map-state)" strokeWidth="1.2" fill="none" opacity="0.85">
        {stateOutlines.map((line, i) => (
          <polyline
            key={i}
            points={line.map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`).join(" ")}
            strokeDasharray="2 3"
          />
        ))}
      </g>

      <g fill="#a89882" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="0.18em">
        {stateLabels.map((s, i) => (
          <text key={i} x={D.lonToX(s.x)} y={D.latToY(s.y)} textAnchor="middle">
            {s.t}
          </text>
        ))}
      </g>

      <g stroke="var(--map-road)" strokeWidth="1.1" fill="none" opacity="0.7">
        {roads.map((r, i) => (
          <polyline
            key={i}
            points={r.map(([lng, lat]) => `${D.lonToX(lng)},${D.latToY(lat)}`).join(" ")}
            strokeLinecap="round"
            strokeDasharray={i < 3 ? "0" : "4 3"}
          />
        ))}
      </g>

      <path
        d={`M ${D.lonToX(-97.5)} ${D.latToY(28)} Q ${D.lonToX(-92)} ${D.latToY(29.2)}, ${D.lonToX(-88)} ${D.latToY(28.5)} L ${D.lonToX(-82)} ${D.latToY(28)} L 1200 640 L ${D.lonToX(-97.5)} 640 Z`}
        fill="var(--map-water)"
        opacity="0.7"
      />
      <text
        x={D.lonToX(-90)}
        y={D.latToY(27.5) + 30}
        fill="#8ba894"
        fontFamily="var(--font-display)"
        fontSize="18"
        fontStyle="italic"
        textAnchor="middle"
      >
        Gulf of Mexico
      </text>

      <path
        d={routePath}
        stroke="var(--map-route-soft)"
        strokeWidth="6"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      <path
        d={routePath}
        stroke="var(--map-route)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {driveSegments.map((seg, i) => {
        if (!seg.from || !seg.to) return null;
        const p1 = D.project(seg.from.coords[0], seg.from.coords[1]);
        const p2 = D.project(seg.to.coords[0], seg.to.coords[1]);
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2 - 14;
        return (
          <g key={i} opacity="0.85">
            <rect x={mx - 56} y={my - 11} width="112" height="18" rx="3" fill="#fbf6ef" stroke="#d9986f55" />
            <text x={mx} y={my + 2} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fill="#6b6661">
              {seg.label}
            </text>
          </g>
        );
      })}

      {showFallback &&
        stops
          .filter((s) => s.fallback)
          .map((s) => {
            const p = D.project(s.fallback!.coords[0], s.fallback!.coords[1]);
            const p0 = D.project(s.coords[0], s.coords[1]);
            return (
              <g key={`fb-${s.id}`} opacity="0.7">
                <line
                  x1={p0.x}
                  y1={p0.y}
                  x2={p.x}
                  y2={p.y}
                  stroke="var(--map-route-fallback)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="none"
                  stroke="var(--map-route-fallback)"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <text
                  x={p.x + 10}
                  y={p.y - 4}
                  fontFamily="var(--font-mono)"
                  fontSize="9.5"
                  fill="#5e7868"
                  letterSpacing="0.1em"
                >
                  FALLBACK · {s.fallback!.name.toUpperCase()}
                </text>
              </g>
            );
          })}

      {stops.map((s) => {
        const p = D.project(s.coords[0], s.coords[1]);
        const isSelected = s.id === selectedId;
        const r = s.kind === "workstop" ? 11 : s.kind === "camp" ? 8 : 9;
        const fill =
          s.kind === "workstop"
            ? "var(--color-primary)"
            : s.kind === "camp"
              ? "var(--color-bg)"
              : s.kind === "origin" || s.kind === "destination"
                ? "var(--color-secondary)"
                : "var(--color-bg)";
        const stroke =
          s.kind === "workstop"
            ? "#a86241"
            : s.kind === "camp"
              ? "var(--color-secondary)"
              : s.kind === "origin" || s.kind === "destination"
                ? "#4f6e5d"
                : "var(--color-primary)";
        const labelBelow = s.kind !== "workstop";
        const labelX = labelBelow ? p.x : p.x + r + 6;
        const labelY = labelBelow ? p.y + r + 14 : p.y - 2;
        const subY = labelBelow ? p.y + r + 26 : p.y + 12;
        const anchor = labelBelow ? "middle" : "start";

        return (
          <g key={s.id} style={{ cursor: onSelect ? "pointer" : undefined }} onClick={() => showStop(s)}>
            {isSelected && (
              <circle cx={p.x} cy={p.y} r={r + 8} fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.4" />
            )}
            <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth="2" />
            {s.kind === "workstop" && (
              <text
                x={p.x}
                y={p.y + 3.5}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="11"
                fontWeight="700"
                fill="#fff"
              >
                W
              </text>
            )}
            {s.feasible === "warn" && (
              <g transform={`translate(${p.x + r - 2} ${p.y - r - 2})`}>
                <circle r="6" fill="#c98a3b" stroke="#fbf6ef" strokeWidth="1.2" />
                <text x="0" y="3" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9" fontWeight="700" fill="#fff">
                  !
                </text>
              </g>
            )}
            <text
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              fontFamily="var(--font-sans)"
              fontSize="11.5"
              fontWeight="600"
              fill="var(--color-text)"
            >
              {s.name}
            </text>
            <text
              x={labelX}
              y={subY}
              textAnchor={anchor}
              fontFamily="var(--font-mono)"
              fontSize="9.5"
              fill="var(--color-text-soft)"
              letterSpacing="0.1em"
            >
              {s.loc.split(" \u2014 ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
