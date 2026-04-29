"use client";

import { Billboard } from "@react-three/drei";
import { AdditiveBlending } from "three";

interface NebulaLayerProps {
  color: string;
  position: [number, number, number];
  scale: number;
  opacity: number;
}

export function NebulaLayer({
  color,
  position,
  scale,
  opacity,
}: NebulaLayerProps) {
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[scale, scale]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
}
