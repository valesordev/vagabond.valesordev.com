import { useState } from "react";

const COLORS = {
  bg: "#0a0e1a",
  panel: "#0d1424",
  border: "#1a2a4a",
  grid: "#0f1e35",
  cyan: "#00d4ff",
  cyanDim: "#0077aa",
  cyanFaint: "#003344",
  amber: "#ffb347",
  amberFaint: "#331a00",
  green: "#39ff80",
  red: "#ff4d6d",
  gray: "#4a6080",
  textPrimary: "#c8dff5",
  textDim: "#6a8aaa",
  textBright: "#eef6ff",
  purple: "#c084fc",
  purpleFaint: "#1a0a2a",
};

const TABS = ["Top-Down Floor Plan", "Side Profile", "Systems Overview"];

function BlueprintGrid({ width, height }) {
  const step = 20;
  const lines = [];
  for (let x = 0; x <= width; x += step)
    lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke={COLORS.grid} strokeWidth="0.5" />);
  for (let y = 0; y <= height; y += step)
    lines.push(<line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke={COLORS.grid} strokeWidth="0.5" />);
  return <g>{lines}</g>;
}

function DimArrow({ x1, y1, x2, y2, label, offset = 12, color = COLORS.cyanDim }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const isH = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  const lx = isH ? mx : mx + offset;
  const ly = isH ? my - offset : my;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" markerStart="url(#arrowS)" markerEnd="url(#arrowE)" />
      <text x={lx} y={ly} fill={color} fontSize="9" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}

// ── Top-Down Floor Plan ───────────────────────────────────────────────────────
function TopDownView() {
  const W = 700, H = 560;
  const scale = 5.8;
  const carW = 48 * scale;
  const carL = 73.5 * scale;
  const ox = (W - carW) / 2;
  const oy = 60;

  const wwW = 9 * scale;
  const wwH = 22 * scale;
  const wwY = oy + carL - wwH;

  const platformRearH = 48 * scale;
  const platformFrontH = 22 * scale;
  const platformY_rear = oy + 4;
  const platformY_front = platformY_rear + platformRearH;

  const drawerSplit = carW * 0.52;

  const mattW = (carW - 4);
  const mattH = (platformRearH + platformFrontH - 6);

  // Jackery 2000v2 footprint: ~15.1" x 10.5" → scaled
  const j2kW = 15.1 * scale;
  const j2kH = 10.5 * scale;
  // Position: driver's side (left), toward rear hatch
  const j2kX = ox + 4;
  const j2kY = platformY_rear + 22;

  // Jackery 1000v2 footprint: ~13.4" x 9.3" → scaled
  const j1kW = 13.4 * scale;
  const j1kH = 9.3 * scale;
  // Position: passenger's side (right), toward rear hatch
  const j1kX = ox + carW - j1kW - 4;
  const j1kY = platformY_rear + 22;

  // SolarSaga panels folded: ~24.2" x 21.1" each → stored flat in cargo when driving
  const panW = 21.1 * scale;
  const panH = 24.2 * scale;
  // Stacked centrally in rear area when stored
  const panX = ox + (carW - panW) / 2 - 4;
  const panY = platformY_rear + platformRearH - panH - 4;

  // BougeRV 23Qt: ~19.7" x 11.6" footprint
  const coolerW = 11.6 * scale;
  const coolerH = 19.7 * scale;
  const coolerX = ox + (carW - coolerW) / 2;
  const coolerY = platformY_front + 4;

  return (
    <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
      <defs>
        <marker id="arrowS" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,1.5 L3,3 L0,4.5" fill="none" stroke={COLORS.cyanDim} strokeWidth="1" />
        </marker>
        <marker id="arrowE" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,1.5 L3,3 L0,4.5" fill="none" stroke={COLORS.cyanDim} strokeWidth="1" />
        </marker>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={COLORS.cyanFaint} strokeWidth="1.5" />
        </pattern>
        <pattern id="solarHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(30)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#332200" strokeWidth="2" />
        </pattern>
      </defs>
      <BlueprintGrid width={W} height={H} />

      {/* Vehicle Outline */}
      <rect x={ox} y={oy} width={carW} height={carL} fill="#060d1a" stroke={COLORS.cyan} strokeWidth="2" rx="4" />
      <text x={W / 2} y={oy - 10} fill={COLORS.textDim} fontSize="10" textAnchor="middle" fontFamily="monospace">← REAR HATCH (access point)</text>
      <text x={W / 2} y={oy + carL + 18} fill={COLORS.textDim} fontSize="10" textAnchor="middle" fontFamily="monospace">↑ REAR SEAT FOLD LINE</text>

      {/* Wheel wells */}
      {[ox, ox + carW - wwW].map((x, i) => (
        <rect key={i} x={x} y={wwY} width={wwW} height={wwH}
          fill="#0a1828" stroke={COLORS.gray} strokeWidth="1.5" strokeDasharray="4,2" />
      ))}
      <text x={ox + wwW / 2} y={wwY + wwH / 2} fill={COLORS.gray} fontSize="8" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">WW</text>
      <text x={ox + carW - wwW / 2} y={wwY + wwH / 2} fill={COLORS.gray} fontSize="8" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">WW</text>

      {/* REAR FIXED PLATFORM */}
      <rect x={ox + 2} y={platformY_rear} width={carW - 4} height={platformRearH}
        fill="rgba(0,100,150,0.12)" stroke={COLORS.cyan} strokeWidth="1.5" />
      <text x={ox + carW / 2} y={platformY_rear + 14} fill={COLORS.cyan} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
        REAR PLATFORM — FIXED
      </text>

      {/* SolarSaga panels (stored flat) */}
      <rect x={panX} y={panY} width={panW} height={panH}
        fill="rgba(255,180,50,0.08)" stroke={COLORS.amber} strokeWidth="1" strokeDasharray="4,3" rx="3" />
      <text x={panX + panW / 2} y={panY + panH / 2 - 8} fill={COLORS.amber} fontSize="8" textAnchor="middle" fontFamily="monospace">SOLARSAGA 200W</text>
      <text x={panX + panW / 2} y={panY + panH / 2 + 4} fill={COLORS.amber} fontSize="8" textAnchor="middle" fontFamily="monospace">×2 (STACKED)</text>
      <text x={panX + panW / 2} y={panY + panH / 2 + 15} fill={COLORS.textDim} fontSize="7" textAnchor="middle" fontFamily="monospace">24"×21" ea, stored flat</text>

      {/* Jackery 2000v2 */}
      <rect x={j2kX} y={j2kY} width={j2kW} height={j2kH}
        fill={COLORS.cyanFaint} stroke={COLORS.green} strokeWidth="1.5" rx="3" />
      <text x={j2kX + j2kW / 2} y={j2kY + j2kH / 2 - 10} fill={COLORS.green} fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">JACKERY</text>
      <text x={j2kX + j2kW / 2} y={j2kY + j2kH / 2 + 0} fill={COLORS.green} fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">2000v2</text>
      <text x={j2kX + j2kW / 2} y={j2kY + j2kH / 2 + 11} fill={COLORS.textDim} fontSize="7" textAnchor="middle" fontFamily="monospace">2042Wh PRIMARY</text>
      <text x={j2kX + j2kW / 2} y={j2kY + j2kH / 2 + 21} fill={COLORS.textDim} fontSize="7" textAnchor="middle" fontFamily="monospace">15.1"×10.5"×12.7"</text>

      {/* Jackery 1000v2 */}
      <rect x={j1kX} y={j1kY} width={j1kW} height={j1kH}
        fill={COLORS.cyanFaint} stroke={COLORS.cyan} strokeWidth="1.5" rx="3" />
      <text x={j1kX + j1kW / 2} y={j1kY + j1kH / 2 - 10} fill={COLORS.cyan} fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">JACKERY</text>
      <text x={j1kX + j1kW / 2} y={j1kY + j1kH / 2 + 0} fill={COLORS.cyan} fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">1000v2</text>
      <text x={j1kX + j1kW / 2} y={j1kY + j1kH / 2 + 11} fill={COLORS.textDim} fontSize="7" textAnchor="middle" fontFamily="monospace">1070Wh SECONDARY</text>
      <text x={j1kX + j1kW / 2} y={j1kY + j1kH / 2 + 21} fill={COLORS.textDim} fontSize="7" textAnchor="middle" fontFamily="monospace">13.4"×9.3"×9.7"</text>

      {/* FRONT REMOVABLE SECTION with cooler */}
      <rect x={ox + 2} y={platformY_front} width={carW - 4} height={platformFrontH}
        fill="rgba(255,160,50,0.07)" stroke={COLORS.amber} strokeWidth="1.5" strokeDasharray="6,3" />
      <text x={ox + carW / 2} y={platformY_front + 14} fill={COLORS.amber} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
        FRONT SECTION — REMOVABLE (2-pin latch)
      </text>

      {/* BougeRV Cooler in front section */}
      <rect x={coolerX} y={coolerY} width={coolerW} height={coolerH}
        fill="rgba(100,200,100,0.1)" stroke={COLORS.green} strokeWidth="1" rx="2" />
      <text x={coolerX + coolerW / 2} y={coolerY + coolerH / 2 - 8} fill={COLORS.green} fontSize="8" textAnchor="middle" fontFamily="monospace">BougeRV</text>
      <text x={coolerX + coolerW / 2} y={coolerY + coolerH / 2 + 4} fill={COLORS.green} fontSize="8" textAnchor="middle" fontFamily="monospace">23Qt</text>

      {/* Mattress overlay */}
      <rect x={ox + 4} y={oy + 6} width={mattW} height={mattH}
        fill="none" stroke={COLORS.red} strokeWidth="1.5" strokeDasharray="8,4" rx="6" />
      <text x={ox + mattW / 2 + 4} y={oy + 46} fill={COLORS.red} fontSize="9" textAnchor="middle" fontFamily="monospace">← SLEEP ZONE ~66" × 44" →</text>

      {/* Curtain rail */}
      <line x1={ox - 8} y1={platformY_front + platformFrontH} x2={ox + carW + 8} y2={platformY_front + platformFrontH}
        stroke={COLORS.purple} strokeWidth="3" />
      <text x={W / 2} y={platformY_front + platformFrontH + 13} fill={COLORS.purple} fontSize="9" textAnchor="middle" fontFamily="monospace">
        — PRIVACY CURTAIN RAIL (C-pillar to C-pillar) —
      </text>

      {/* StarLink mini note */}
      <rect x={ox + carW + 14} y={oy + 20} width={72} height={40}
        fill={COLORS.purpleFaint} stroke={COLORS.purple} strokeWidth="1" rx="2" />
      <text x={ox + carW + 50} y={oy + 33} fill={COLORS.purple} fontSize="8" textAnchor="middle" fontFamily="monospace">STARLINK</text>
      <text x={ox + carW + 50} y={oy + 44} fill={COLORS.purple} fontSize="8" textAnchor="middle" fontFamily="monospace">MINI</text>
      <text x={ox + carW + 50} y={oy + 54} fill={COLORS.textDim} fontSize="7" textAnchor="middle" fontFamily="monospace">↑ roof/window</text>

      {/* Dimensions */}
      <DimArrow x1={ox} y1={H - 28} x2={ox + carW} y2={H - 28} label='48"' offset={0} />
      <DimArrow x1={ox - 30} y1={oy} x2={ox - 30} y2={oy + carL} label='73.5"' offset={0} />
      <DimArrow x1={ox + carW + 22} y1={platformY_rear} x2={ox + carW + 22} y2={platformY_rear + platformRearH} label='48"' offset={0} />
      <DimArrow x1={ox + carW + 22} y1={platformY_front} x2={ox + carW + 22} y2={platformY_front + platformFrontH} label='22"' offset={0} />

      {/* Legend */}
      <g transform={`translate(14, 20)`}>
        {[
          [COLORS.cyan, "Fixed platform"],
          [COLORS.amber, "Removable section"],
          [COLORS.red, "Sleep zone"],
          [COLORS.purple, "Curtain / StarLink"],
          [COLORS.green, "Power / cooling"],
          [COLORS.gray, "Wheel wells"],
        ].map(([color, label], i) => (
          <g key={i} transform={`translate(0, ${i * 16})`}>
            <rect x={0} y={0} width={12} height={9} fill={color} opacity={0.7} rx="1" />
            <text x={16} y={8} fill={COLORS.textDim} fontSize="8" fontFamily="monospace">{label}</text>
          </g>
        ))}
      </g>

      <text x={W / 2} y={H - 6} fill={COLORS.textDim} fontSize="9" textAnchor="middle" fontFamily="monospace">
        SCALE APPROXIMATE · 5th Gen Toyota 4Runner · Digital Nomad / Off-Road Build v0.2
      </text>
    </svg>
  );
}

// ── Side Profile Cross-Section ────────────────────────────────────────────────
function SideProfileView() {
  const W = 680, H = 520;
  const scale = 7.5;
  const floorH = 34 * scale;
  const ox = 80, oy = 60;
  const totalL = 73.5 * scale;

  const layers = [
    { label: "Factory Floor", h: 0, thick: 1, color: "#1a3050", fill: "#0d1e30" },
    { label: "Platform Frame (3/4\" ply or 80/20 extrusion)", h: 1, thick: 3, color: COLORS.cyanDim, fill: "#0a2035" },
    { label: "Jackery Storage / Drawer Space (~11\")", h: 4, thick: 11, color: COLORS.cyanFaint, fill: "rgba(0,80,120,0.15)", dashed: true },
    { label: "Platform Top (3/4\" ply)", h: 15, thick: 0.75, color: COLORS.cyan, fill: "rgba(0,180,255,0.2)" },
    { label: "Sleeping Pad (3.5\" closed-cell foam)", h: 15.75, thick: 3.5, color: "#1a4a2a", fill: "rgba(30,120,60,0.3)" },
    { label: "Sleeper (5'8\" clearance from roof: ~15\")", h: 19.25, thick: 14.75, color: COLORS.grid, fill: "rgba(0,30,60,0.0)", dashed: true },
  ];

  const ceilY = oy;
  const floorY = oy + floorH;
  const rearEndX = ox + 48 * scale;
  const frontEndX = ox + totalL;

  const layerRects = layers.map((l) => {
    const y = floorY - (l.h + l.thick) * scale;
    const height = l.thick * scale;
    return { ...l, y, height };
  });

  return (
    <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
      <defs>
        <marker id="arrowS2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,1.5 L3,3 L0,4.5" fill="none" stroke={COLORS.cyanDim} strokeWidth="1" />
        </marker>
        <marker id="arrowE2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,1.5 L3,3 L0,4.5" fill="none" stroke={COLORS.cyanDim} strokeWidth="1" />
        </marker>
      </defs>
      <BlueprintGrid width={W} height={H} />

      {/* Ceiling */}
      <rect x={ox} y={ceilY} width={totalL} height={4} fill="#0d2040" stroke={COLORS.cyan} strokeWidth="1.5" />
      <text x={ox + totalL / 2} y={ceilY - 10} fill={COLORS.textDim} fontSize="10" textAnchor="middle" fontFamily="monospace">HEADLINER / CEILING (34" clearance)</text>

      {/* Floor */}
      <rect x={ox} y={floorY} width={totalL} height={8} fill="#0d1e30" stroke={COLORS.gray} strokeWidth="1.5" />

      {/* Side walls */}
      <line x1={ox} y1={ceilY} x2={ox} y2={floorY + 8} stroke={COLORS.cyan} strokeWidth="2" />
      <line x1={ox + totalL} y1={ceilY} x2={ox + totalL} y2={floorY + 8} stroke={COLORS.amber} strokeWidth="2" strokeDasharray="6,3" />

      {/* Labels */}
      <text x={ox - 4} y={floorY - floorH / 2} fill={COLORS.cyan} fontSize="9" textAnchor="middle" fontFamily="monospace"
        transform={`rotate(-90, ${ox - 14}, ${floorY - floorH / 2})`}>REAR HATCH</text>
      <text x={ox + totalL + 20} y={floorY - floorH / 2} fill={COLORS.amber} fontSize="9" textAnchor="middle" fontFamily="monospace"
        transform={`rotate(90, ${ox + totalL + 14}, ${floorY - floorH / 2})`}>REAR SEATS</text>

      {/* Platform layers */}
      {layerRects.map((l, i) => (
        <g key={i}>
          <rect x={ox + 2} y={l.y} width={totalL - 4} height={l.height}
            fill={l.fill} stroke={l.color}
            strokeWidth={l.thick < 1 ? 1 : 1.5}
            strokeDasharray={l.dashed ? "6,3" : undefined} rx="1" />
        </g>
      ))}

      {/* Jackery 2000v2 profile (inside drawer space, driver's side) */}
      {(() => {
        const drawerTop = floorY - 15 * scale;
        const drawerBottom = floorY - 4 * scale;
        const jH = drawerBottom - drawerTop - 4;
        const jW = 15.1 * scale * 0.85; // approximate visible width in profile
        return (
          <g>
            <rect x={ox + 4} y={drawerTop + 2} width={jW} height={jH}
              fill={COLORS.cyanFaint} stroke={COLORS.green} strokeWidth="1" rx="2" />
            <text x={ox + jW / 2 + 4} y={drawerTop + jH / 2 + 2} fill={COLORS.green} fontSize="8" textAnchor="middle" fontFamily="monospace">2000v2</text>
          </g>
        );
      })()}

      {/* Vertical divider: rear fixed / front removable */}
      <line x1={rearEndX} y1={ceilY + 4} x2={rearEndX} y2={floorY}
        stroke={COLORS.amber} strokeWidth="1.5" strokeDasharray="8,4" />
      <text x={rearEndX} y={floorY + 22} fill={COLORS.amber} fontSize="9" textAnchor="middle" fontFamily="monospace">SECTION JOINT</text>

      {/* Curtain rail */}
      <line x1={rearEndX - 2} y1={ceilY + 4} x2={rearEndX - 2} y2={ceilY + 100}
        stroke={COLORS.purple} strokeWidth="3" />
      <text x={rearEndX + 30} y={ceilY + 55} fill={COLORS.purple} fontSize="9" textAnchor="start" fontFamily="monospace">CURTAIN RAIL</text>

      {/* Roof vent fan */}
      <rect x={ox + totalL / 2 - 22} y={ceilY - 16} width={44} height={16}
        fill={COLORS.cyanFaint} stroke={COLORS.cyanDim} strokeWidth="1.5" rx="3" />
      <text x={ox + totalL / 2} y={ceilY - 5} fill={COLORS.cyan} fontSize="8" textAnchor="middle" fontFamily="monospace">ROOF VENT FAN</text>

      {/* StarLink mini antenna */}
      <rect x={ox + totalL / 2 + 40} y={ceilY - 10} width={32} height={8}
        fill={COLORS.purpleFaint} stroke={COLORS.purple} strokeWidth="1" rx="2" />
      <text x={ox + totalL / 2 + 56} y={ceilY - 3} fill={COLORS.purple} fontSize="7" textAnchor="middle" fontFamily="monospace">SLMINI</text>

      {/* Layer callout labels */}
      {[
        [floorY - 2 * scale, "Platform frame 3\""],
        [floorY - 9.5 * scale, "Jackery / drawer 11\""],
        [floorY - 15.375 * scale, "Platform top 0.75\""],
        [floorY - 17.5 * scale, "Foam pad 3.5\""],
        [floorY - 26.5 * scale, "Sleeper clearance 14.75\""],
      ].map(([y, label], i) => (
        <g key={i}>
          <line x1={ox + totalL + 4} y1={y} x2={ox + totalL + 30} y2={y}
            stroke={COLORS.cyanDim} strokeWidth="0.5" strokeDasharray="3,2" />
          <text x={ox + totalL + 33} y={y + 4} fill={COLORS.textDim} fontSize="9" fontFamily="monospace">{label}</text>
        </g>
      ))}

      {/* Height dimension */}
      <line x1={ox - 40} y1={ceilY} x2={ox - 40} y2={floorY} stroke={COLORS.cyanDim} strokeWidth="1"
        markerStart="url(#arrowS2)" markerEnd="url(#arrowE2)" />
      <text x={ox - 50} y={(ceilY + floorY) / 2} fill={COLORS.cyanDim} fontSize="9" textAnchor="middle" fontFamily="monospace"
        transform={`rotate(-90, ${ox - 50}, ${(ceilY + floorY) / 2})`}>34" interior</text>

      {/* Length dimension */}
      <line x1={ox} y1={H - 25} x2={ox + totalL} y2={H - 25} stroke={COLORS.cyanDim} strokeWidth="1"
        markerStart="url(#arrowS2)" markerEnd="url(#arrowE2)" />
      <text x={ox + totalL / 2} y={H - 10} fill={COLORS.cyanDim} fontSize="9" textAnchor="middle" fontFamily="monospace">73.5" total cargo length</text>

      <line x1={ox} y1={H - 40} x2={rearEndX} y2={H - 40} stroke={COLORS.cyan} strokeWidth="1"
        markerStart="url(#arrowS2)" markerEnd="url(#arrowE2)" />
      <text x={ox + (rearEndX - ox) / 2} y={H - 44} fill={COLORS.cyan} fontSize="8" textAnchor="middle" fontFamily="monospace">48" fixed</text>

      <text x={W / 2} y={H - 2} fill={COLORS.textDim} fontSize="9" textAnchor="middle" fontFamily="monospace">
        SIDE PROFILE · NOT TO SCALE VERTICALLY · Digital Nomad / Off-Road Build v0.2
      </text>
    </svg>
  );
}

// ── Systems Overview — Jackery Ecosystem ─────────────────────────────────────
function SystemsView() {
  const W = 700, H = 540;

  const nodes = [
    // Charge sources
    { id: "sol1", x: 100, y: 40, w: 130, h: 40, label: "SolarSaga 200W #1", sub: "20.4V/9.8A max · XT60 out", color: COLORS.amber },
    { id: "sol2", x: 460, y: 40, w: 130, h: 40, label: "SolarSaga 200W #2", sub: "20.4V/9.8A max · XT60 out", color: COLORS.amber },
    { id: "car12v", x: 280, y: 40, w: 130, h: 40, label: "Car 12V Outlet", sub: "Alternator (driving)", color: COLORS.cyanDim },
    // Primary station
    { id: "j2k", x: 120, y: 150, w: 210, h: 56, label: "Jackery 2000v2", sub: "2042Wh LiFePO4 · 2200W AC · 600W solar in", color: COLORS.green },
    // Secondary station
    { id: "j1k", x: 370, y: 150, w: 210, h: 56, label: "Jackery 1000v2", sub: "1070Wh LiFePO4 · 1000W AC · 400W solar in", color: COLORS.cyan },
    // Distribution from 2000v2
    { id: "ac2k", x: 50, y: 280, w: 100, h: 36, label: "AC Outlets ×4", sub: "2200W (2000v2)", color: COLORS.green },
    { id: "dc2k", x: 185, y: 280, w: 100, h: 36, label: "12V DC ×2", sub: "12V/10A each (2000v2)", color: COLORS.green },
    { id: "usbc2k", x: 320, y: 280, w: 100, h: 36, label: "USB-C ×2", sub: "100W each (2000v2)", color: COLORS.green },
    // Distribution from 1000v2
    { id: "ac1k", x: 450, y: 280, w: 100, h: 36, label: "AC Outlet ×2", sub: "1000W (1000v2)", color: COLORS.cyan },
    { id: "usbc1k", x: 585, y: 280, w: 100, h: 36, label: "USB-C ×2", sub: "100W each (1000v2)", color: COLORS.cyan },
    // Loads
    { id: "cooler", x: 30, y: 390, w: 110, h: 38, label: "BougeRV 23Qt", sub: "35-45W · 12V DC preferred", color: COLORS.green },
    { id: "starlink", x: 175, y: 390, w: 110, h: 38, label: "StarLink Mini", sub: "~25W · USB-C 30W PD", color: COLORS.purple },
    { id: "laptop", x: 320, y: 390, w: 110, h: 38, label: "Laptop/Work", sub: "USB-C 100W", color: COLORS.cyan },
    { id: "lights", x: 465, y: 390, w: 100, h: 38, label: "LED Lighting", sub: "12V strip + reading", color: COLORS.green },
    { id: "fan", x: 580, y: 390, w: 100, h: 38, label: "Vent Fan", sub: "12V · ~3-5W", color: COLORS.green },
  ];

  const edges = [
    // Solar to stations
    { from: "sol1", to: "j2k", note: "XT60" },
    { from: "sol2", to: "j2k", note: "XT60 Y-cable" },
    { from: "sol1", to: "j1k", note: "(alt)" },
    { from: "car12v", to: "j2k", note: "12V→DC" },
    // 2000v2 to distribution
    { from: "j2k", to: "ac2k" },
    { from: "j2k", to: "dc2k" },
    { from: "j2k", to: "usbc2k" },
    // 1000v2 to distribution
    { from: "j1k", to: "ac1k" },
    { from: "j1k", to: "usbc1k" },
    // Loads
    { from: "dc2k", to: "cooler" },
    { from: "usbc2k", to: "starlink" },
    { from: "usbc2k", to: "laptop" },
    { from: "dc2k", to: "lights" },
    { from: "dc2k", to: "fan" },
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const edgePaths = edges.map(({ from, to }) => {
    const na = nodeMap[from], nb = nodeMap[to];
    if (!na || !nb) return null;
    const x1 = na.x + na.w / 2, y1 = na.y + na.h;
    const x2 = nb.x + nb.w / 2, y2 = nb.y;
    const my = (y1 + y2) / 2;
    return { path: `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`, color: na.color };
  }).filter(Boolean);

  return (
    <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
      <BlueprintGrid width={W} height={H} />

      {/* Section labels */}
      {[
        [20, 18, "CHARGE SOURCES"],
        [20, 130, "POWER STATIONS"],
        [20, 262, "DISTRIBUTION PORTS"],
        [20, 372, "LOADS"],
      ].map(([x, y, label]) => (
        <text key={label} x={x} y={y} fill={COLORS.gray} fontSize="9" fontFamily="monospace" letterSpacing="2">{label}</text>
      ))}

      {/* Horizontal section dividers */}
      {[100, 222, 355].map((y, i) => (
        <line key={i} x1={10} y1={y} x2={W - 10} y2={y} stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="4,4" />
      ))}

      {/* Edges */}
      {edgePaths.map((e, i) => (
        <path key={i} d={e.path} fill="none" stroke={e.color} strokeWidth="1.5" opacity={0.4} strokeDasharray="5,3" />
      ))}

      {/* Nodes */}
      {nodes.map(n => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h}
            fill={COLORS.panel} stroke={n.color} strokeWidth="1.5" rx="4" />
          <text x={n.x + n.w / 2} y={n.y + (n.h > 40 ? 16 : 13)} fill={n.color} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{n.label}</text>
          <text x={n.x + n.w / 2} y={n.y + (n.h > 40 ? 29 : 26)} fill={COLORS.textDim} fontSize="8" textAnchor="middle" fontFamily="monospace">{n.sub}</text>
          {n.h > 40 && <text x={n.x + n.w / 2} y={n.y + 41} fill={COLORS.textDim} fontSize="7.5" textAnchor="middle" fontFamily="monospace">{n.sub2 || ""}</text>}
        </g>
      ))}

      {/* Primary/Secondary labels */}
      <rect x={118} y={148} width={214} height={60} fill="none" stroke={COLORS.green} strokeWidth="2" rx="6" />
      <rect x={368} y={148} width={214} height={60} fill="none" stroke={COLORS.cyan} strokeWidth="2" strokeDasharray="6,3" rx="6" />
      <text x={122} y={144} fill={COLORS.green} fontSize="8" fontFamily="monospace">PRIMARY</text>
      <text x={372} y={144} fill={COLORS.cyan} fontSize="8" fontFamily="monospace">SECONDARY / PORTABLE</text>

      {/* Capacity note */}
      <rect x={20} y={470} width={660} height={52} fill={COLORS.cyanFaint} stroke={COLORS.cyanDim} strokeWidth="1" rx="4" />
      <text x={350} y={487} fill={COLORS.textDim} fontSize="9" textAnchor="middle" fontFamily="monospace">
        TOTAL CAPACITY: 3112Wh (2042 + 1070) · SOLAR INPUT: 400W max (2× SolarSaga 200W via Y-cable → 2000v2)
      </text>
      <text x={350} y={501} fill={COLORS.amber} fontSize="9" textAnchor="middle" fontFamily="monospace">
        StarLink Mini ~25W avg · BougeRV 23Qt ~35-45W avg · Combined daily: est. 400-600Wh
      </text>
      <text x={350} y={515} fill={COLORS.textDim} fontSize="8.5" textAnchor="middle" fontFamily="monospace">
        With 400W solar: full 2000v2 recharge in ~5-6 hrs sun · Recharge 1000v2 simultaneously via second panel
      </text>

      <text x={W / 2} y={H - 4} fill={COLORS.textDim} fontSize="9" textAnchor="middle" fontFamily="monospace">
        ELECTRICAL SYSTEMS · Jackery Ecosystem · Digital Nomad / Off-Road Build v0.2
      </text>
    </svg>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      fontFamily: "monospace",
      color: COLORS.textPrimary,
      padding: "24px 16px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ color: COLORS.cyan, fontSize: 11, letterSpacing: 4, marginBottom: 6 }}>
          ENGINEERING REFERENCE · REV 0.2
        </div>
        <h1 style={{ margin: 0, fontSize: 22, color: COLORS.textBright, letterSpacing: 1 }}>
          5th Gen Toyota 4Runner · Digital Nomad / Off-Road Build
        </h1>
        <div style={{ color: COLORS.textDim, fontSize: 11, marginTop: 6 }}>
          Off-Road Premium Package · Dual-Mode: Campground + Stealth · Jackery Ecosystem · StarLink Mini
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: tab === i ? COLORS.cyanFaint : COLORS.panel,
            border: `1px solid ${tab === i ? COLORS.cyan : COLORS.border}`,
            color: tab === i ? COLORS.cyan : COLORS.textDim,
            padding: "8px 16px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: 1,
          }}>{t}</button>
        ))}
      </div>

      <div style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "16px 8px",
        maxWidth: 760,
        margin: "0 auto",
      }}>
        {tab === 0 && <TopDownView />}
        {tab === 1 && <SideProfileView />}
        {tab === 2 && <SystemsView />}
      </div>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 20,
        marginTop: 20,
        flexWrap: "wrap",
      }}>
        {[
          ["SLEEP ZONE", "66\" × 44\""],
          ["PLATFORM HT", "15.75\""],
          ["HEADROOM", "~14.75\""],
          ["TOTAL CAPACITY", "3112 Wh"],
          ["SOLAR INPUT", "400W (2×200W)"],
          ["CONNECTIVITY", "StarLink Mini"],
          ["COOLING", "BougeRV 23Qt"],
          ["STEALTH SETUP", "<90 sec"],
        ].map(([k, v]) => (
          <div key={k} style={{ textAlign: "center" }}>
            <div style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: 2 }}>{k}</div>
            <div style={{ color: COLORS.cyan, fontSize: 13, fontWeight: "bold" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
