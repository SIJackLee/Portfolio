"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Mesh } from "three";
import { PlanetDomain } from "@/components/space/types";

interface PlanetNodeProps {
  planet: PlanetDomain;
  position: [number, number, number];
  size: number;
  glowScale: number;
  isHovered: boolean;
  isSelected: boolean;
  hoverEmissiveBoost: number;
  onHover: (id: PlanetDomain["id"] | null) => void;
  onSelect: (id: PlanetDomain["id"]) => void;
}

export function PlanetNode({
  planet,
  position,
  size,
  glowScale,
  isHovered,
  isSelected,
  hoverEmissiveBoost,
  onHover,
  onSelect,
}: PlanetNodeProps) {
  const nodeGroupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const auraRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const isActive = isHovered || isSelected;
    const speed = isActive ? 1.4 : 1;
    const targetScale = isActive ? 1.12 : 1;

    if (nodeGroupRef.current) {
      const current = nodeGroupRef.current.scale.x;
      const next = current + (targetScale - current) * 0.14;
      nodeGroupRef.current.scale.setScalar(next);
    }

    if (coreRef.current) {
      coreRef.current.rotation.y += 0.01 * speed;
      coreRef.current.rotation.x += 0.003 * speed;
    }

    if (auraRef.current) {
      const pulse = 1 + Math.sin(t * 1.2) * 0.07;
      auraRef.current.scale.setScalar(glowScale * pulse);
    }
  });

  const emissiveScale = isHovered || isSelected ? hoverEmissiveBoost : 1;
  const showIcon = isHovered && !isSelected;
  const displayText = planet.icon;
  const displayFontSize = size * 0.62;

  return (
    <group
      ref={nodeGroupRef}
      position={position}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(planet.id);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onHover(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(planet.id);
      }}
    >
      <mesh ref={auraRef} scale={[glowScale, glowScale, glowScale]}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.color}
          emissiveIntensity={1.5 * emissiveScale}
          transparent
          opacity={isSelected ? 0.28 : 0.2}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[size * 0.6, 8]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.color}
          emissiveIntensity={1.2 * emissiveScale}
          metalness={0.65}
          roughness={0.25}
        />
      </mesh>
      {showIcon && (
        <>
          <Billboard position={[0, 0, size * 0.78]}>
            <mesh>
              <circleGeometry args={[size * 0.35, 32]} />
              <meshBasicMaterial color="#060b18" transparent opacity={0.72} />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={displayFontSize}
              color="#f6fbff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.01}
              outlineColor="#0f1f3d"
            >
              {displayText}
            </Text>
          </Billboard>
        </>
      )}
    </group>
  );
}
