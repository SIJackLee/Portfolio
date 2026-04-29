"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useMemo, useState } from "react";
import { PlanetNode } from "@/components/space/PlanetNode";
import { PlanetDomain } from "@/components/space/types";

interface OrbitPlanetsProps {
  planets: PlanetDomain[];
  selectedId: PlanetDomain["id"] | null;
  hoveredId: PlanetDomain["id"] | null;
  onHover: (id: PlanetDomain["id"] | null) => void;
  onSelect: (id: PlanetDomain["id"]) => void;
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
  const axisRotation = (axisRotationDeg * Math.PI) / 180;
  const cosAxis = Math.cos(axisRotation);
  const sinAxis = Math.sin(axisRotation);
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
    orbitPhaseRef.current += delta * rotationSpeed;
    setOrbitPhase(orbitPhaseRef.current);
  });

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

        return (
          <group key={planet.id}>
            {(isHovered || isSelected) && (
              <Line
                points={[
                  [0, 0, 0],
                  [x, y, z],
                ]}
                color={planet.color}
                lineWidth={1.2}
                transparent
                opacity={0.7}
              />
            )}
            <PlanetNode
              planet={planet}
              position={[x, y, z]}
              size={nodeSize}
              glowScale={glowScale}
              isHovered={isHovered}
              isSelected={isSelected}
              hoverEmissiveBoost={hoverEmissiveBoost}
              onHover={onHover}
              onSelect={onSelect}
            />
          </group>
        );
      })}
    </group>
  );
}
