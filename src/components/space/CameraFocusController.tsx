"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useMemo } from "react";
import { Vector3 } from "three";
import { PlanetDomain } from "@/components/space/types";

interface CameraFocusControllerProps {
  selectedPlanet: PlanetDomain | null;
  enabled: boolean;
  totalPlanets: number;
  radiusX: number;
  radiusY: number;
  axisRotationDeg: number;
  orbitPhaseRef: MutableRefObject<number>;
  orbitExpanded: boolean;
  orbitExpandScale: number;
}

export function CameraFocusController({
  selectedPlanet,
  enabled,
  totalPlanets,
  radiusX,
  radiusY,
  axisRotationDeg,
  orbitPhaseRef,
  orbitExpanded,
  orbitExpandScale,
}: CameraFocusControllerProps) {
  const { camera } = useThree();
  const fallbackPosition = useMemo(() => new Vector3(0, 0, 8), []);
  const axisRotation = (axisRotationDeg * Math.PI) / 180;
  const cosAxis = Math.cos(axisRotation);
  const sinAxis = Math.sin(axisRotation);

  useFrame(() => {
    if (!enabled || !selectedPlanet) {
      camera.position.lerp(fallbackPosition, 0.03);
      camera.lookAt(0, 0, -14);
      return;
    }

    const orbitPhase = orbitPhaseRef.current;
    const angle =
      (selectedPlanet.orbitIndex / totalPlanets) * Math.PI * 2 + orbitPhase;
    const baseX = Math.cos(angle) * radiusX;
    const baseY = Math.sin(angle) * radiusY;
    const rotatedX = baseX * cosAxis - baseY * sinAxis;
    const rotatedY = baseX * sinAxis + baseY * cosAxis;
    const localZ = Math.sin(angle * 1.5) * 0.8;
    const scale = orbitExpanded ? orbitExpandScale : 1;
    const worldX = rotatedX * scale;
    const worldY = rotatedY * scale;
    const worldZ = (-14 + localZ) * scale;
    const targetPosition = new Vector3(worldX * 0.56, worldY * 0.56, worldZ + 7.2);

    camera.position.lerp(targetPosition, 0.024);
    camera.lookAt(worldX, worldY, worldZ);
  });

  return null;
}
