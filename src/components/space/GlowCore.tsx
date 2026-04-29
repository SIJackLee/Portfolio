"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Mesh } from "three";
import { FresnelMaterial } from "@/components/space/materials/FresnelMaterial";

interface GlowCoreProps {
  coreColor: string;
  auraColor: string;
  cloudColor: string;
  emissiveIntensity: number;
  coreScale: number;
  pulseSpeed: number;
  atmosphereColor: string;
  ringColor: string;
  outerRingColor: string;
  ringTilt: number;
  ringTiltSecondary: number;
  fresnelPower: number;
  fresnelIntensity: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function GlowCore({
  coreColor,
  auraColor,
  cloudColor,
  emissiveIntensity,
  coreScale,
  pulseSpeed,
  atmosphereColor,
  ringColor,
  outerRingColor,
  ringTilt,
  ringTiltSecondary,
  fresnelPower,
  fresnelIntensity,
  isExpanded,
  onToggleExpand,
}: GlowCoreProps) {
  const planetGroupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const cloudRef = useRef<Mesh>(null);
  const auraRef = useRef<Mesh>(null);
  const innerRingRef = useRef<Mesh>(null);
  const outerRingRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * pulseSpeed) * 0.03;
    const slowDrift = Math.sin(t * 0.2) * 0.08;

    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.z = slowDrift * 0.2;
    }

    if (coreRef.current) {
      coreRef.current.scale.setScalar(coreScale * pulse);
      coreRef.current.rotation.y += 0.0014;
    }

    if (cloudRef.current) {
      cloudRef.current.scale.setScalar(coreScale * (1.012 + pulse * 0.005));
      cloudRef.current.rotation.y -= 0.0008;
    }

    if (auraRef.current) {
      const auraPulse = 1 + Math.sin(t * pulseSpeed * 0.7) * 0.04;
      auraRef.current.scale.setScalar(coreScale * 1.8 * auraPulse);
      auraRef.current.rotation.y -= 0.0006;
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += 0.0007;
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= 0.00048;
    }
  });

  return (
    <group
      ref={planetGroupRef}
      position={[0, 0, -14]}
      onClick={(event) => {
        event.stopPropagation();
        onToggleExpand();
      }}
    >
      <mesh ref={auraRef} scale={[1.7, 1.7, 1.7]}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshStandardMaterial
          color={auraColor}
          emissive={auraColor}
          emissiveIntensity={emissiveIntensity * 0.55}
          transparent
          opacity={isExpanded ? 0.24 : 0.17}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 12]} />
        <meshPhysicalMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={emissiveIntensity * (isExpanded ? 0.95 : 0.8)}
          roughness={0.38}
          metalness={0.36}
          clearcoat={0.72}
          clearcoatRoughness={0.22}
        />
      </mesh>

      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.08, 56, 56]} />
        <meshStandardMaterial
          color={cloudColor}
          emissive={cloudColor}
          emissiveIntensity={emissiveIntensity * 0.2}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={[1.24, 1.24, 1.24]}>
        <sphereGeometry args={[1, 56, 56]} />
        <FresnelMaterial
          color={atmosphereColor}
          power={fresnelPower}
          intensity={fresnelIntensity}
          alpha={0.5}
        />
      </mesh>

      <mesh ref={innerRingRef} rotation={[ringTilt, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 190]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={emissiveIntensity * 0.58}
          transparent
          opacity={0.83}
          roughness={0.2}
          metalness={0.75}
        />
      </mesh>

      <mesh ref={outerRingRef} rotation={[ringTiltSecondary, 0, 0]}>
        <torusGeometry args={[1.82, 0.028, 16, 220]} />
        <meshStandardMaterial
          color={outerRingColor}
          emissive={outerRingColor}
          emissiveIntensity={emissiveIntensity * 0.42}
          transparent
          opacity={0.64}
          roughness={0.32}
          metalness={0.52}
        />
      </mesh>
    </group>
  );
}
