export type ColorHex = `#${string}`;
export type InteractionMode = "modal" | "focus";

/** Orbit planet row: who receives focus-merge visuals vs peer dimming. */
export type FocusMergeRole = "target" | "peer" | "idle";

export interface PlanetProject {
  title: string;
  description: string;
  tags: string[];
  url: string;
  status: "project" | "study";
}

export interface GravityZoneNode {
  id: string;
  label: string;
  color: ColorHex;
  summary: string;
  projects: PlanetProject[];
}

export interface PlanetDomain {
  id:
    | "simulation"
    | "circuit"
    | "protocol"
    | "server"
    | "db"
    | "web"
    | "data-engineering"
    | "ai";
  label: string;
  stackLabel: string;
  color: ColorHex;
  summary: string;
  orbitIndex: number;
  projects: PlanetProject[];
  gravityNodes?: GravityZoneNode[];
  gravityDefaultNodeId?: string;
}

export interface SpaceTheme {
  background: {
    deepSpace: ColorHex;
    deepSpaceAlt: ColorHex;
    nebulaPrimary: ColorHex;
    nebulaSecondary: ColorHex;
    vignette: string;
  };
  stars: {
    count: number;
    radius: number;
    depth: number;
    saturation: number;
    speed: number;
  };
  orbit: {
    radiusX: number;
    radiusY: number;
    nodeSize: number;
    glowScale: number;
    rotationSpeed: number;
    hoverEmissiveBoost: number;
    /**
     * Orbit billboard glyph: approximate max half-extent in units of `size * layoutScale`
     * (same `size` as `PlanetNode`). Tuned so default offsets + `layoutScale` 1 stay inside
     * the aura sphere for the current `nodeSize` / `glowScale`; retune if those change or if
     * `PlanetIconAccent` pack scale changes.
     */
    orbitIconHalfExtentPerLayoutScale: number;
    /** Multiply available tangent clearance (0–1) before dividing by half-extent constant. */
    orbitIconSphereInset: number;
    /** Focus mode: core/aura → icon merge timing and peer dimming. */
    focusMerge: {
      /** Camera must be within this distance of ideal focus camera position (world units). */
      cameraSettleEps: number;
      /** Consecutive frames under eps before merge can start. */
      cameraSettleFrames: number;
      /** Minimum time (ms) after selection before merge can reach 1. */
      minDelayMs: number;
      /** Lerp speed toward merge target 0 or 1 (higher = snappier). */
      progressLerpSpeed: number;
      /** Extra multiplier when releasing merge (target 0). */
      progressLerpOutMul: number;
      /** At merge 1, non-selected planets sit at this fraction of their orbit radius from origin (XY). */
      peerOrbitRadiusMul: number;
      /** At merge 1, scales emissive/opacity for non-selected planets (0–1). */
      peerDimStrength: number;
    };
  };
  glow: {
    coreColor: ColorHex;
    auraColor: ColorHex;
    cloudColor: ColorHex;
    emissiveIntensity: number;
    coreScale: number;
    pulseSpeed: number;
    atmosphereColor: ColorHex;
    ringColor: ColorHex;
    outerRingColor: ColorHex;
    ringTilt: number;
    ringTiltSecondary: number;
    fresnelPower: number;
    fresnelIntensity: number;
  };
  lightRig: {
    ambientIntensity: number;
    keyIntensity: number;
    keyColor: ColorHex;
    keyPosition: [number, number, number];
    rimIntensity: number;
    rimColor: ColorHex;
    rimPosition: [number, number, number];
    fillIntensity: number;
    fillColor: ColorHex;
    fillPosition: [number, number, number];
  };
  postFx: {
    bloomIntensity: number;
    bloomLuminanceThreshold: number;
    bloomLuminanceSmoothing: number;
    noiseOpacity: number;
    chromaticAberrationOffset: number;
  };
}
