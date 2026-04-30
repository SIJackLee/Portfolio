"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { focusPlanetLookAtAndCamera } from "@/components/space/focusCameraTarget";
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
  const lookAtTmp = useRef(new Vector3());
  const camTargetTmp = useRef(new Vector3());

  useFrame(() => {
    if (!enabled || !selectedPlanet) {
      camera.position.lerp(fallbackPosition, 0.03);
      camera.lookAt(0, 0, -14);
      return;
    }

    const { lookAt, camera: cam } = focusPlanetLookAtAndCamera({
      selected: selectedPlanet,
      totalPlanets,
      orbitPhase: orbitPhaseRef.current,
      radiusX,
      radiusY,
      axisRotationDeg,
      orbitExpanded,
      orbitExpandScale,
    });
    lookAtTmp.current.set(lookAt[0], lookAt[1], lookAt[2]);
    camTargetTmp.current.set(cam[0], cam[1], cam[2]);

    camera.position.lerp(camTargetTmp.current, 0.017);
    camera.lookAt(lookAtTmp.current);
  });

  return null;
}
