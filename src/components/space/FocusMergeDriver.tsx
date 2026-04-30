"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useRef } from "react";
import { Vector3 } from "three";
import { focusPlanetLookAtAndCamera } from "@/components/space/focusCameraTarget";
import { InteractionMode, PlanetDomain } from "@/components/space/types";
import { spaceTheme } from "@/config/spaceTheme";

interface FocusMergeDriverProps {
  mergeProgressRef: MutableRefObject<number>;
  interactionMode: InteractionMode;
  selectedPlanet: PlanetDomain | null;
  totalPlanets: number;
  radiusX: number;
  radiusY: number;
  axisRotationDeg: number;
  orbitPhaseRef: MutableRefObject<number>;
  orbitExpanded: boolean;
  orbitExpandScale: number;
}

export function FocusMergeDriver({
  mergeProgressRef,
  interactionMode,
  selectedPlanet,
  totalPlanets,
  radiusX,
  radiusY,
  axisRotationDeg,
  orbitPhaseRef,
  orbitExpanded,
  orbitExpandScale,
}: FocusMergeDriverProps) {
  const { camera } = useThree();
  const camTarget = useRef(new Vector3());
  const settleFrames = useRef(0);
  const selectionTime = useRef<number | null>(null);
  const lastSelectedId = useRef<PlanetDomain["id"] | null>(null);
  const fm = spaceTheme.orbit.focusMerge;
  /** Assumes orbit phase stops advancing while focus+selected (`OrbitPlanets`), so this target is steady. */

  useFrame((_, delta) => {
    const p = mergeProgressRef.current;
    let target = 0;

    if (interactionMode === "focus" && selectedPlanet) {
      if (lastSelectedId.current !== selectedPlanet.id) {
        lastSelectedId.current = selectedPlanet.id;
        selectionTime.current = performance.now();
        settleFrames.current = 0;
      }

      const { camera: cam } = focusPlanetLookAtAndCamera({
        selected: selectedPlanet,
        totalPlanets,
        orbitPhase: orbitPhaseRef.current,
        radiusX,
        radiusY,
        axisRotationDeg,
        orbitExpanded,
        orbitExpandScale,
      });
      camTarget.current.set(cam[0], cam[1], cam[2]);
      const dist = camera.position.distanceTo(camTarget.current);

      if (dist < fm.cameraSettleEps) {
        settleFrames.current += 1;
      } else {
        settleFrames.current = 0;
      }

      const delayOk =
        selectionTime.current !== null &&
        performance.now() - selectionTime.current >= fm.minDelayMs;
      const stableOk = settleFrames.current >= fm.cameraSettleFrames;
      if (stableOk && delayOk) {
        target = 1;
      }
    } else {
      lastSelectedId.current = null;
      selectionTime.current = null;
      settleFrames.current = 0;
    }

    const speed =
      fm.progressLerpSpeed * (target < p ? fm.progressLerpOutMul : 1);
    const next = p + (target - p) * Math.min(1, speed * delta);
    mergeProgressRef.current =
      Math.abs(next - target) < 0.0015 ? target : next;
  });

  return null;
}
