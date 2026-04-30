import type { PlanetDomain } from "@/components/space/types";

export function focusPlanetLookAtAndCamera(args: {
  selected: PlanetDomain;
  totalPlanets: number;
  orbitPhase: number;
  radiusX: number;
  radiusY: number;
  axisRotationDeg: number;
  orbitExpanded: boolean;
  orbitExpandScale: number;
}): { lookAt: [number, number, number]; camera: [number, number, number] } {
  const {
    selected,
    totalPlanets,
    orbitPhase,
    radiusX,
    radiusY,
    axisRotationDeg,
    orbitExpanded,
    orbitExpandScale,
  } = args;
  const axisRotation = (axisRotationDeg * Math.PI) / 180;
  const cosAxis = Math.cos(axisRotation);
  const sinAxis = Math.sin(axisRotation);
  const angle = (selected.orbitIndex / totalPlanets) * Math.PI * 2 + orbitPhase;
  const baseX = Math.cos(angle) * radiusX;
  const baseY = Math.sin(angle) * radiusY;
  const rotatedX = baseX * cosAxis - baseY * sinAxis;
  const rotatedY = baseX * sinAxis + baseY * cosAxis;
  const localZ = Math.sin(angle * 1.5) * 0.8;
  const scale = orbitExpanded ? orbitExpandScale : 1;
  const worldX = rotatedX * scale;
  const worldY = rotatedY * scale;
  const worldZ = (-14 + localZ) * scale;
  /** Slightly farther shot than before: less XY toward planet, more +Z toward default camera side. */
  const camX = worldX * 0.5;
  const camY = worldY * 0.5;
  const camZ = worldZ + 8.1;
  return {
    lookAt: [worldX, worldY, worldZ],
    camera: [camX, camY, camZ],
  };
}
