import type { PlanetDomain } from "@/components/space/types";

/**
 * Per-orbit icon layout (core-tilt group local position from camera-facing basis, then inner glyph scale).
 *
 * - offsetX / offsetY / offsetZ: multiples of the planet node `size` (same `size` as `PlanetNode`).
 *   Each frame: start at planet world center, move along **planet → camera** by `(1.28 + oz) * size`,
 *   then add `ox * size` on the view tangent **right** and `oy * size` on the view tangent **up**
 *   (plane orthogonal to that camera direction, derived from the active camera `up`).
 * - scale: multiplied with the inner `PlanetIconAccent` pack scale (default effective inner scale × this value).
 */
interface PlanetIconTuningEntry {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  scale: number;
}

type PlanetIconTuningMap = Record<PlanetDomain["id"], PlanetIconTuningEntry>;

const ZERO: PlanetIconTuningEntry = {
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  scale: 1,
};

/** Default per-domain layout; edit here to change baked-in orbit icon placement/scale. */
export const DEFAULT_ICON_TUNING: PlanetIconTuningMap = {
  simulation: { ...ZERO },
  circuit: { ...ZERO },
  protocol: { ...ZERO },
  server: { ...ZERO },
  db: { ...ZERO },
  web: { ...ZERO },
  "data-engineering": { ...ZERO },
  ai: { ...ZERO },
};

/** Lower bound when clamping layout scale so the glyph stays inside the aura sphere (`PlanetNode`). */
export const ORBIT_ICON_LAYOUT_SCALE_MIN = 0.15;
