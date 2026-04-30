"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useMemo, useRef, useState } from "react";
import { PlanetNode } from "@/components/space/PlanetNode";
import { FocusMergeRole, InteractionMode, PlanetDomain } from "@/components/space/types";
import { spaceTheme } from "@/config/spaceTheme";

interface OrbitPlanetsProps {
  planets: PlanetDomain[];
  selectedId: PlanetDomain["id"] | null;
  hoveredId: PlanetDomain["id"] | null;
  onHover: (id: PlanetDomain["id"] | null) => void;
  onSelect: (id: PlanetDomain["id"]) => void;
  interactionMode: InteractionMode;
  mergeProgressRef: MutableRefObject<number>;
  radiusX: number;
  radiusY: number;
  nodeSize: number;
  glowScale: number;
  hoverEmissiveBoost: number;
  rotationSpeed: number;
  axisRotationDeg: number;
  orbitPhaseRef: MutableRefObject<number>;
}

export function OrbitPlanets({
  planets,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  interactionMode,
  mergeProgressRef,
  radiusX,
  radiusY,
  nodeSize,
  glowScale,
  hoverEmissiveBoost,
  rotationSpeed,
  axisRotationDeg,
  orbitPhaseRef,
}: OrbitPlanetsProps) {
  const [orbitPhase, setOrbitPhase] = useState(0);
  /** Mirrors `mergeProgressRef` for render-only math (ref must not be read during render). */
  const [mergeProgressRender, setMergeProgressRender] = useState(0);
  const lastMergePushRef = useRef<number>(-1);

  const axisRotation = (axisRotationDeg * Math.PI) / 180;
  const cosAxis = Math.cos(axisRotation);
  const sinAxis = Math.sin(axisRotation);
  const peerRadiusMul = spaceTheme.orbit.focusMerge.peerOrbitRadiusMul;

  const orbitPathPoints = useMemo(() => {
    const segments = 120;
    const points: [number, number, number][] = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = (i / segments) * Math.PI * 2;
      const baseX = Math.cos(t) * radiusX;
      const baseY = Math.sin(t) * radiusY;
      const rotatedX = baseX * cosAxis - baseY * sinAxis;
      const rotatedY = baseX * sinAxis + baseY * cosAxis;
      points.push([rotatedX, rotatedY, 0]);
    }
    return points;
  }, [radiusX, radiusY, cosAxis, sinAxis]);

  useFrame((_, delta) => {
    /** Freeze orbit while focus+planet selected so camera / merge settle targets stay still. */
    const freezeOrbit = interactionMode === "focus" && selectedId !== null;
    if (!freezeOrbit) {
      orbitPhaseRef.current += delta * rotationSpeed;
    }
    setOrbitPhase(orbitPhaseRef.current);

    const focusSel = interactionMode === "focus" && selectedId !== null;
    const rawMp = focusSel ? mergeProgressRef.current : 0;
    const prev = lastMergePushRef.current;
    if (
      Math.abs(rawMp - prev) > 0.012 ||
      (rawMp === 0 && prev !== 0 && prev !== -1) ||
      (rawMp >= 0.998 && prev < 0.998)
    ) {
      lastMergePushRef.current = rawMp;
      setMergeProgressRender(rawMp);
    }
  });

  const focusWithSelection = interactionMode === "focus" && selectedId !== null;
  const peerScale = focusWithSelection ? 1 + mergeProgressRender * (peerRadiusMul - 1) : 1;

  return (
    <group position={[0, 0, -14]}>
      <Line
        points={orbitPathPoints}
        color="#6f84c4"
        lineWidth={0.7}
        transparent
        opacity={0.35}
      />
      {planets.map((planet) => {
        const angle = (planet.orbitIndex / planets.length) * Math.PI * 2 + orbitPhase;
        const baseX = Math.cos(angle) * radiusX;
        const baseY = Math.sin(angle) * radiusY;
        const x = baseX * cosAxis - baseY * sinAxis;
        const y = baseX * sinAxis + baseY * cosAxis;
        const z = Math.sin(angle * 1.5) * 0.8;
        const isSelected = selectedId === planet.id;
        const isHovered = hoveredId === planet.id;
        const isPeer = focusWithSelection && !isSelected;
        const px = isPeer ? x * peerScale : x;
        const py = isPeer ? y * peerScale : y;
        const pz = isPeer ? z * peerScale : z;

        const focusMergeRole: FocusMergeRole =
          interactionMode === "focus" && selectedId === planet.id
            ? "target"
            : interactionMode === "focus" && selectedId !== null && selectedId !== planet.id
              ? "peer"
              : "idle";

        return (
          <group key={planet.id}>
            {(isHovered || isSelected) && (
              <Line
                points={[
                  [0, 0, 0],
                  [px, py, pz],
                ]}
                color={planet.color}
                lineWidth={1.2}
                transparent
                opacity={0.7}
              />
            )}
            <PlanetNode
              planet={planet}
              position={[px, py, pz]}
              size={nodeSize}
              glowScale={glowScale}
              isHovered={isHovered}
              isSelected={isSelected}
              hoverEmissiveBoost={hoverEmissiveBoost}
              mergeProgressRef={mergeProgressRef}
              focusMergeRole={focusMergeRole}
              onHover={onHover}
              onSelect={onSelect}
            />
          </group>
        );
      })}
    </group>
  );
}
