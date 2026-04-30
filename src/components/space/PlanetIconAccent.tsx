"use client";

/**
 * Domain silhouettes (scaled by `size`):
 * simulation / protocol — SVG strokes; circuit — gear + inner ring (Hardware); server — network graph + nodes;
 * db / web / data-engineering — Cloud / Data / Web SVG strokes;
 * ai — brain outline + circuit traces + hollow nodes (SVG strokes).
 * Stroke color from `PlanetNode` (muted light); no emissive; global Bloom still reacts to brightness.
 */
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { CubicBezierCurve, Vector2 } from "three";
import { PlanetDomain } from "@/components/space/types";

/** Line art unit vs planet `size` (SVG local scale). */
const ICON_UNIT_SCALE = 0.88;

/** Scales all `lw` bases so less HDR energy hits `Bloom` (plan: orbit icon dazzle). */
const ORBIT_LINE_WIDTH_MUL = 0.65;

function orbitStrokeWidth(u: number): number {
  return Math.max(2, u * 11) * ORBIT_LINE_WIDTH_MUL;
}

/** Line material opacity (drei `Line` forwards to LineMaterial). */
const ORBIT_STROKE_OPACITY = 0.86;

/**
 * Per-domain pack scale on top of `3 * layoutScale` so silhouettes read similar size on screen.
 * Tuned against ~64px SVG art: shrink wide/large glyphs (gear, web dash, AI brain), nudge up compact ones (cloud).
 */
const ORBIT_ICON_DOMAIN_PACK: Record<PlanetDomain["id"], number> = {
  simulation: 1,
  circuit: 0.93,
  protocol: 0.98,
  server: 1,
  db: 1.05,
  web: 1,
  "data-engineering": 0.92,
  ai: 0.9,
};

interface PlanetIconAccentProps {
  planetId: PlanetDomain["id"];
  size: number;
  color: string;
  /** Multiplier on inner icon pack scale (Billboard tuning). Default 1. */
  layoutScale?: number;
}

/** Flat icon fills; emissive off so postFx bloom does not halo orbit glyphs. */
function useAccentMat(color: string) {
  return useMemo(
    () => ({
      color,
      emissive: "#000000",
      emissiveIntensity: 0,
      metalness: 0,
      roughness: 1,
      toneMapped: true as const,
      transparent: true,
      opacity: 0.88,
      depthTest: false,
    }),
    [color]
  );
}

/** SVG (y down) → Billboard local XY (y up); `(cx,cy)` = art centroid in SVG px (re-centers glyph). */
function svgToLocalBatch(
  pts: [number, number][],
  u: number,
  cx: number,
  cy: number
): [number, number, number][] {
  const k = u / 22;
  return pts.map(([x, y]) => [(x - cx) * k, (cy - y) * k, 0]);
}

function svgBBoxCenter(pts: [number, number][]): [number, number] {
  if (pts.length === 0) return [32, 32];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function computeIconSvgCenter(
  segments: [number, number][][],
  bboxExtras?: [number, number][]
): [number, number] {
  const flat = segments.flat();
  const all = bboxExtras ? [...flat, ...bboxExtras] : flat;
  return svgBBoxCenter(all);
}

function SvgStrokeLines({
  segments,
  color,
  u,
  lineWidth,
  bboxExtras,
  fixedCenter,
  strokeOpacity = ORBIT_STROKE_OPACITY,
}: {
  segments: [number, number][][];
  color: string;
  u: number;
  lineWidth: number;
  /** Extra samples so filled disks / hubs affect centroid (not drawn). */
  bboxExtras?: [number, number][];
  /** When set, skip bbox recompute (e.g. layered stroke widths share one pivot). */
  fixedCenter?: [number, number];
  strokeOpacity?: number;
}) {
  const [cx, cy] = fixedCenter ?? computeIconSvgCenter(segments, bboxExtras);
  return (
    <>
      {segments.map((seg, i) => (
        <Line
          key={i}
          points={svgToLocalBatch(seg, u, cx, cy)}
          color={color}
          lineWidth={lineWidth}
          opacity={strokeOpacity}
          toneMapped
          transparent
          depthTest={false}
          renderOrder={5}
        />
      ))}
    </>
  );
}

/** Chamfered rounded-rect outline (rx = corner cut), matches small SVG rx well. */
function chamferRectOutline(sx: number, sy: number, w: number, h: number, rx: number): [number, number][] {
  const r = Math.min(rx, w / 2, h / 2);
  return [
    [sx + r, sy],
    [sx + w - r, sy],
    [sx + w, sy + r],
    [sx + w, sy + h - r],
    [sx + w - r, sy + h],
    [sx + r, sy + h],
    [sx, sy + h - r],
    [sx, sy + r],
    [sx + r, sy],
  ];
}

function v2(x: number, y: number) {
  return new Vector2(x, y);
}

function sampleCubicSvg2d(p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], divisions: number): [number, number][] {
  const c = new CubicBezierCurve(v2(...p0), v2(...p1), v2(...p2), v2(...p3));
  return c.getPoints(divisions).map((pt) => [pt.x, pt.y]);
}

/** Absolute SVG cubics `C` in sequence → one polyline. */
function chainSvgCubics(curves: [number, number][][]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < curves.length; i += 1) {
    const [p0, p1, p2, p3] = curves[i];
    const part = sampleCubicSvg2d(p0, p1, p2, p3, 12);
    if (i === 0) out.push(...part);
    else out.push(...part.slice(1));
  }
  return out;
}

/** Ellipse in SVG coords (y down), full loop. */
function sampleEllipseSvg(cx: number, cy: number, rx: number, ry: number, segments: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return out;
}

function svgVecAngle(ux: number, uy: number, vx: number, vy: number): number {
  const lu = Math.hypot(ux, uy);
  const lv = Math.hypot(vx, vy);
  if (lu < 1e-12 || lv < 1e-12) return 0;
  let ang = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / (lu * lv))));
  if (ux * vy - uy * vx < 0) ang = -ang;
  return ang;
}

/**
 * SVG elliptical arc (endpoint form) → polyline, SVG coords (y down).
 * @see https://svgwg.org/svg2-draft/implnote.html#ArcImplementationNotes (B.2.4–B.2.5, eq. 3.1)
 */
function sampleSvgEllipticalArc(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  largeArcFlag: number,
  sweepFlag: number,
  x2: number,
  y2: number,
  segments: number
): [number, number][] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx < 1e-9 || ry < 1e-9) {
    return [
      [x1, y1],
      [x2, y2],
    ];
  }

  const phi = (phiDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const rxSq = rx * rx;
  const rySq = ry * ry;
  const denom = rxSq * y1p * y1p + rySq * x1p * x1p;
  const radicand = denom > 1e-18 ? (rxSq * rySq - rxSq * y1p * y1p - rySq * x1p * x1p) / denom : 0;
  const cSign = largeArcFlag === sweepFlag ? -1 : 1;
  const cq = cSign * Math.sqrt(Math.max(0, radicand));
  const cxp = cq * ((rx * y1p) / ry);
  const cyp = cq * ((-ry * x1p) / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const ux1 = (x1p - cxp) / rx;
  const uy1 = (y1p - cyp) / ry;
  const vx1 = (-x1p - cxp) / rx;
  const vy1 = (-y1p - cyp) / ry;

  const theta1 = svgVecAngle(1, 0, ux1, uy1);
  let deltaTheta = svgVecAngle(ux1, uy1, vx1, vy1);
  if (!sweepFlag && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
  if (sweepFlag && deltaTheta < 0) deltaTheta += 2 * Math.PI;

  const out: [number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = theta1 + (deltaTheta * i) / segments;
    const ox = rx * Math.cos(t);
    const oy = ry * Math.sin(t);
    const x = ox * cosPhi - oy * sinPhi + cx;
    const y = ox * sinPhi + oy * cosPhi + cy;
    out.push([x, y]);
  }
  return out;
}

/** Exact `d` from Cloud SVG: `M20 42h24a8…z` (relative arcs). */
function cloudAccentStroke(): [number, number][] {
  const line: [number, number][] = [
    [20, 42],
    [44, 42],
  ];
  const a1 = sampleSvgEllipticalArc(44, 42, 8, 8, 0, 0, 0, 44, 26, 18).slice(1);
  const a2 = sampleSvgEllipticalArc(44, 26, 11, 11, 0, 0, 0, 23, 23, 22).slice(1);
  const a3 = sampleSvgEllipticalArc(23, 23, 8, 8, 0, 0, 0, 20, 42, 18).slice(1);
  return [...line, ...a1, ...a2, ...a3, [20, 42]];
}

/** [Simulation] isometric wireframe cube (SVG paths). */
function SimulationAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lw = orbitStrokeWidth(u);
  const segments: [number, number][][] = [
    [
      [32, 10],
      [50, 20],
      [32, 30],
      [14, 20],
      [32, 10],
    ],
    [
      [14, 20],
      [14, 40],
      [32, 50],
      [32, 30],
    ],
    [
      [50, 20],
      [50, 40],
      [32, 50],
      [32, 30],
    ],
    [[32, 10], [32, 30]],
  ];
  return <SvgStrokeLines segments={segments} color={color} u={u} lineWidth={lw} />;
}

/** [Hardware] outer gear polygon + inner circle (SVG stroke-width 2.6 ref). */
function hardwareGearOutline(): [number, number][] {
  return [
    [32, 12],
    [35, 12],
    [36.5, 17],
    [42, 18.5],
    [45.5, 15],
    [49, 18.5],
    [45.5, 23],
    [47, 28.5],
    [52, 30],
    [52, 34],
    [47, 35.5],
    [45.5, 41],
    [49, 44.5],
    [45.5, 48],
    [42, 44.5],
    [36.5, 46],
    [35, 51],
    [29, 51],
    [27.5, 46],
    [22, 44.5],
    [18.5, 48],
    [15, 44.5],
    [18.5, 41],
    [17, 35.5],
    [12, 34],
    [12, 30],
    [17, 28.5],
    [18.5, 23],
    [15, 18.5],
    [18.5, 15],
    [22, 18.5],
    [27.5, 17],
    [29, 12],
    [32, 12],
  ];
}

function HardwareAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lw = orbitStrokeWidth(u);
  const gear = hardwareGearOutline();
  const inner = svgStrokeCircle(32, 32, 8, 28);
  const segments: [number, number][][] = [gear, inner];
  return <SvgStrokeLines segments={segments} color={color} u={u} lineWidth={lw} />;
}

/** [Circuit] nested boards + traces + filled center pad (SVG). */
function CircuitAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lw = orbitStrokeWidth(u);
  const outer = chamferRectOutline(18, 18, 28, 28, 4);
  const inner = chamferRectOutline(24, 24, 16, 16, 2);
  const segments: [number, number][][] = [
    outer,
    inner,
    [
      [8, 24],
      [16, 24],
    ],
    [
      [8, 32],
      [16, 32],
    ],
    [
      [8, 40],
      [16, 40],
    ],
    [
      [48, 24],
      [56, 24],
    ],
    [
      [48, 32],
      [56, 32],
    ],
    [
      [48, 40],
      [56, 40],
    ],
    [
      [24, 8],
      [24, 16],
    ],
    [
      [32, 8],
      [32, 16],
    ],
    [
      [40, 8],
      [40, 16],
    ],
    [
      [24, 48],
      [24, 56],
    ],
    [
      [32, 48],
      [32, 56],
    ],
    [
      [40, 48],
      [40, 56],
    ],
  ];
  const k = u / 22;
  const r = 2 * k;
  const hubBBoxSamples = svgStrokeCircle(32, 32, 2, 14);
  const [cx, cy] = computeIconSvgCenter(segments, hubBBoxSamples);
  return (
    <group>
      <SvgStrokeLines segments={segments} color={color} u={u} lineWidth={lw} bboxExtras={hubBBoxSamples} />
      <mesh position={[(32 - cx) * k, (cy - 32) * k, 0.004]} renderOrder={5}>
        <circleGeometry args={[r, 20]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

/** Closed polyline on SVG canvas (y down); used for strokes and bbox sampling. */
function svgStrokeCircle(cx: number, cy: number, r: number, segments = 20): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts;
}

/** [Network] hub, spokes, inter-node links, filled center + stroked satellites (SVG). */
function ProtocolAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lw = orbitStrokeWidth(u);
  const segments: [number, number][][] = [
    [[32, 32], [32, 14]],
    [[32, 32], [18, 24]],
    [[32, 32], [46, 24]],
    [[32, 32], [20, 46]],
    [[32, 32], [44, 46]],
    [
      [18, 24],
      [32, 14],
      [46, 24],
    ],
    [
      [20, 46],
      [32, 32],
      [44, 46],
    ],
    [
      [18, 24],
      [20, 46],
    ],
    [
      [46, 24],
      [44, 46],
    ],
    svgStrokeCircle(32, 12, 3),
    svgStrokeCircle(16, 24, 3),
    svgStrokeCircle(48, 24, 3),
    svgStrokeCircle(20, 48, 3),
    svgStrokeCircle(44, 48, 3),
  ];
  const k = u / 22;
  const hubBBoxSamples = svgStrokeCircle(32, 32, 4, 16);
  const [cx, cy] = computeIconSvgCenter(segments, hubBBoxSamples);
  return (
    <group>
      <SvgStrokeLines segments={segments} color={color} u={u} lineWidth={lw} bboxExtras={hubBBoxSamples} />
      <mesh position={[(32 - cx) * k, (cy - 32) * k, 0.006]} renderOrder={5}>
        <circleGeometry args={[4 * k, 22]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

/** [Cloud] single-stroke cloud outline (SVG path approximated). */
function CloudAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lw = orbitStrokeWidth(u);
  const segments: [number, number][][] = [cloudAccentStroke()];
  return <SvgStrokeLines segments={segments} color={color} u={u} lineWidth={lw} />;
}

/** Horizontal “rib” cubic pair: `M20 Y c0 2.8 5.4 5 12 5 s12-2.2 12-5`. */
function dataRibStroke(y: number): [number, number][] {
  const a = sampleCubicSvg2d([20, y], [20, y + 2.8], [25.4, y + 5], [32, y + 5], 8);
  const b = sampleCubicSvg2d([32, y + 5], [38.6, y + 5], [44, y + 2.8], [44, y], 8).slice(1);
  return [...a, ...b];
}

/** [Data] cylinder + ribs (SVG). */
function DbAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lw = orbitStrokeWidth(u);
  const segments: [number, number][][] = [
    sampleEllipseSvg(32, 18, 12, 5, 28),
    [
      [20, 18],
      [20, 42],
    ],
    [
      [44, 18],
      [44, 42],
    ],
    dataRibStroke(26),
    dataRibStroke(34),
    dataRibStroke(42),
  ];
  return <SvgStrokeLines segments={segments} color={color} u={u} lineWidth={lw} />;
}

/** [Web] dashboard frame + panels + chart ticks; header dots filled. */
function WebAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lw = orbitStrokeWidth(u);
  const segments: [number, number][][] = [
    chamferRectOutline(10, 12, 44, 32, 4),
    [
      [10, 20],
      [54, 20],
    ],
    chamferRectOutline(15, 25, 10, 14, 1.5),
    chamferRectOutline(29, 25, 20, 6, 1.5),
    chamferRectOutline(29, 34, 20, 10, 1.5),
    [
      [33, 41],
      [33, 38],
    ],
    [
      [38, 41],
      [38, 36],
    ],
    [
      [43, 41],
      [43, 39],
    ],
  ];
  const bboxExtras = [
    ...svgStrokeCircle(16, 16, 1.5, 10),
    ...svgStrokeCircle(21, 16, 1.5, 10),
    ...svgStrokeCircle(26, 16, 1.5, 10),
  ];
  const k = u / 22;
  const [cx, cy] = computeIconSvgCenter(segments, bboxExtras);
  const dots: [number, number][] = [
    [16, 16],
    [21, 16],
    [26, 16],
  ];
  return (
    <group>
      <SvgStrokeLines segments={segments} color={color} u={u} lineWidth={lw} bboxExtras={bboxExtras} />
      {dots.map(([dx, dy], i) => (
        <mesh key={i} position={[(dx - cx) * k, (cy - dy) * k, 0.006]} renderOrder={5}>
          <circleGeometry args={[1.5 * k, 12]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  );
}

/** [AI] brain hemispheres + sulcus + circuit traces + hollow nodes (SVG). */
function AiAccent({ u, mat }: { u: number; mat: ReturnType<typeof useAccentMat> }) {
  const color = String(mat.color);
  const lwBase = orbitStrokeWidth(u);
  const lwBrain = lwBase * (2.8 / 2.5);
  const lwTrace = lwBase * (2.2 / 2.5);
  const lwNode = lwBase * (2.0 / 2.5);

  const brainL = chainSvgCubics([
    [
      [31, 19],
      [28, 17],
      [23.5, 18],
      [22.8, 22.5],
    ],
    [
      [22.8, 22.5],
      [18.5, 23],
      [16, 26.5],
      [17, 30.5],
    ],
    [
      [17, 30.5],
      [13.8, 32.5],
      [13.8, 37.3],
      [17, 39.5],
    ],
    [
      [17, 39.5],
      [15.8, 43.8],
      [19.2, 47.8],
      [23.8, 47],
    ],
    [
      [23.8, 47],
      [25.8, 50],
      [30, 48.8],
      [31, 45.5],
    ],
  ]);
  const brainR = chainSvgCubics([
    [
      [33, 19],
      [36, 17],
      [40.5, 18],
      [41.2, 22.5],
    ],
    [
      [41.2, 22.5],
      [45.5, 23],
      [48, 26.5],
      [47, 30.5],
    ],
    [
      [47, 30.5],
      [50.2, 32.5],
      [50.2, 37.3],
      [47, 39.5],
    ],
    [
      [47, 39.5],
      [48.2, 43.8],
      [44.8, 47.8],
      [40.2, 47],
    ],
    [
      [40.2, 47],
      [38.2, 50],
      [34, 48.8],
      [33, 45.5],
    ],
  ]);
  const sulcus: [number, number][] = [
    [32, 19],
    [32, 49],
  ];
  const traces: [number, number][][] = [
    [
      [28, 26],
      [23.8, 26],
    ],
    [
      [28, 34],
      [21.8, 34],
    ],
    [
      [28, 42],
      [24.8, 42],
    ],
    [
      [21.8, 34],
      [24.8, 37],
      [28, 37],
    ],
    [
      [36, 26],
      [40.2, 26],
    ],
    [
      [36, 34],
      [42.2, 34],
    ],
    [
      [36, 42],
      [39.2, 42],
    ],
    [
      [42.2, 34],
      [39.2, 37],
      [36, 37],
    ],
  ];
  const nodeR = 2.16;
  const nodeLoops: [number, number][][] = [
    svgStrokeCircle(21, 26, nodeR, 16),
    svgStrokeCircle(19, 34, nodeR, 16),
    svgStrokeCircle(22, 42, nodeR, 16),
    svgStrokeCircle(43, 26, nodeR, 16),
    svgStrokeCircle(45, 34, nodeR, 16),
    svgStrokeCircle(42, 42, nodeR, 16),
  ];

  const centerPts: [number, number][] = [
    ...brainL,
    ...brainR,
    ...sulcus,
    ...traces.flat(),
    ...nodeLoops.flat(),
  ];
  const [cx, cy] = svgBBoxCenter(centerPts);
  const fixed: [number, number] = [cx, cy];

  return (
    <group>
      <SvgStrokeLines
        segments={[brainL, brainR, sulcus]}
        color={color}
        u={u}
        lineWidth={lwBrain}
        fixedCenter={fixed}
      />
      <SvgStrokeLines segments={traces} color={color} u={u} lineWidth={lwTrace} fixedCenter={fixed} />
      <SvgStrokeLines segments={nodeLoops} color={color} u={u} lineWidth={lwNode} fixedCenter={fixed} />
    </group>
  );
}

export function PlanetIconAccent({
  planetId,
  size,
  color,
  layoutScale = 1,
}: PlanetIconAccentProps) {
  const u = size * ICON_UNIT_SCALE;
  const mat = useAccentMat(color);

  let accent: ReactNode;
  switch (planetId) {
    case "simulation":
      accent = <SimulationAccent u={u} mat={mat} />;
      break;
    case "circuit":
      accent = <HardwareAccent u={u} mat={mat} />;
      break;
    case "protocol":
      accent = <CircuitAccent u={u} mat={mat} />;
      break;
    case "server":
      accent = <ProtocolAccent u={u} mat={mat} />;
      break;
    case "db":
      accent = <CloudAccent u={u} mat={mat} />;
      break;
    case "web":
      accent = <DbAccent u={u} mat={mat} />;
      break;
    case "data-engineering":
      accent = <WebAccent u={u} mat={mat} />;
      break;
    case "ai":
      accent = <AiAccent u={u} mat={mat} />;
      break;
  }

  const packScale = 3 * layoutScale * ORBIT_ICON_DOMAIN_PACK[planetId];

  return (
    <group renderOrder={5}>
      <group scale={packScale}>{accent}</group>
    </group>
  );
}
