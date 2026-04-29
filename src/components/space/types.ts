export type ColorHex = `#${string}`;
export type InteractionMode = "modal" | "focus";

export interface PlanetProject {
  title: string;
  description: string;
  tags: string[];
  url: string;
  status: "project" | "study";
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
  icon: string;
  color: ColorHex;
  summary: string;
  orbitIndex: number;
  projects: PlanetProject[];
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
