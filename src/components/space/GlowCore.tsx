"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import { FresnelMaterial } from "@/components/space/materials/FresnelMaterial";
import { PlanetIconAccent } from "@/components/space/PlanetIconAccent";
import { PlanetDomain } from "@/components/space/types";

const ICON_GLOW_PROFILE: Partial<
  Record<PlanetDomain["id"], { innerOpacityMul: number; outerOpacityMul: number; scaleMul: number }>
> = {
  // Stroke-only silhouettes need more halo energy to match perceived glow.
  simulation: { innerOpacityMul: 1.34, outerOpacityMul: 1.44, scaleMul: 1.12 },
  db: { innerOpacityMul: 1.3, outerOpacityMul: 1.38, scaleMul: 1.1 }, // Cloud label
  web: { innerOpacityMul: 1.32, outerOpacityMul: 1.4, scaleMul: 1.12 }, // Data label
  ai: { innerOpacityMul: 1.38, outerOpacityMul: 1.5, scaleMul: 1.15 },
};

const AURA_EMISSIVE_MUL = 0.78;
const CLOUD_EMISSIVE_MUL = 0.8;
const RING_EMISSIVE_MUL = 0.76;
const ICON_HALO_OPACITY_MUL = 0.78;
const CENTER_BRIGHTNESS_MUL = 0.5;

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
  showCenterIotLabel: boolean;
  hoverAccentColor: string | null;
  hoverAccentPlanetId: PlanetDomain["id"] | null;
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
  showCenterIotLabel,
  hoverAccentColor,
  hoverAccentPlanetId,
}: GlowCoreProps) {
  const planetGroupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const cloudRef = useRef<Mesh>(null);
  const auraRef = useRef<Mesh>(null);
  const innerRingRef = useRef<Mesh>(null);
  const outerRingRef = useRef<Mesh>(null);
  const iconMorphRef = useRef<Group>(null);
  const iconGlowInnerRef = useRef<Mesh>(null);
  const iconGlowOuterRef = useRef<Mesh>(null);
  const accentMixRef = useRef(0);
  const morphProgressRef = useRef(0);
  const accentColorRef = useRef(new Color());
  const scratchColor = useRef(new Color());
  const scratchEmissive = useRef(new Color());

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

    const morphTarget = hoverAccentPlanetId ? 1 : 0;
    morphProgressRef.current += (morphTarget - morphProgressRef.current) * 0.09;
    const morph = morphProgressRef.current;

    const targetMix = hoverAccentColor ? 1 : 0;
    accentMixRef.current += (targetMix - accentMixRef.current) * 0.08;
    const mix = accentMixRef.current;
    if (hoverAccentColor) {
      accentColorRef.current.set(hoverAccentColor);
    }
    const accent = accentColorRef.current;
    const glowProfile = hoverAccentPlanetId ? ICON_GLOW_PROFILE[hoverAccentPlanetId] : undefined;
    const innerOpacityMul = glowProfile?.innerOpacityMul ?? 1;
    const outerOpacityMul = glowProfile?.outerOpacityMul ?? 1;
    const scaleMul = glowProfile?.scaleMul ?? 1;

    if (coreRef.current) {
      const coreMat = coreRef.current.material as MeshStandardMaterial;
      scratchColor.current.set(coreColor);
      scratchEmissive.current.set(coreColor);
      if (mix > 0.001) {
        scratchColor.current.lerp(accent, mix * 0.78);
        scratchEmissive.current.lerp(accent, mix * 0.9);
      }
      coreMat.color.copy(scratchColor.current);
      coreMat.emissive.copy(scratchEmissive.current);
      coreMat.emissiveIntensity =
        emissiveIntensity *
        (isExpanded ? 0.5712 : 0.476) *
        (1 - morph * 0.72) *
        CENTER_BRIGHTNESS_MUL;
      coreRef.current.scale.multiplyScalar(1 - morph * 0.8);
    }

    if (auraRef.current) {
      const auraMat = auraRef.current.material as MeshStandardMaterial;
      scratchColor.current.set(auraColor);
      scratchEmissive.current.set(auraColor);
      if (mix > 0.001) {
        scratchColor.current.lerp(accent, mix * 0.42);
        scratchEmissive.current.lerp(accent, mix * 0.58);
      }
      auraMat.color.copy(scratchColor.current);
      auraMat.emissive.copy(scratchEmissive.current);
      auraMat.emissiveIntensity =
        emissiveIntensity *
        0.55 *
        AURA_EMISSIVE_MUL *
        (1 - morph * 0.35) *
        CENTER_BRIGHTNESS_MUL;
      auraMat.opacity = (isExpanded ? 0.24 : 0.17) * (1 - morph * 0.45) * CENTER_BRIGHTNESS_MUL;
    }

    if (iconMorphRef.current) {
      const iconScale = 0.18 + morph * 0.36;
      iconMorphRef.current.visible = morph > 0.005;
      iconMorphRef.current.scale.setScalar(iconScale);
    }

    if (iconGlowInnerRef.current) {
      const innerGlowMat = iconGlowInnerRef.current.material as MeshBasicMaterial;
      const innerPulse = 0.88 + Math.sin(t * 3.2) * 0.12;
      innerGlowMat.color.set(accent);
      innerGlowMat.opacity =
        (0.08 + morph * 0.26) * innerOpacityMul * ICON_HALO_OPACITY_MUL * CENTER_BRIGHTNESS_MUL;
      iconGlowInnerRef.current.scale.setScalar((1 + morph * 0.35) * innerPulse * scaleMul);
    }

    if (iconGlowOuterRef.current) {
      const outerGlowMat = iconGlowOuterRef.current.material as MeshBasicMaterial;
      const outerPulse = 0.92 + Math.sin(t * 2.6 + 0.5) * 0.09;
      outerGlowMat.color.set(accent);
      outerGlowMat.opacity =
        (0.05 + morph * 0.16) * outerOpacityMul * ICON_HALO_OPACITY_MUL * CENTER_BRIGHTNESS_MUL;
      iconGlowOuterRef.current.scale.setScalar((1.26 + morph * 0.5) * outerPulse * scaleMul);
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
          emissiveIntensity={emissiveIntensity * 0.55 * AURA_EMISSIVE_MUL * CENTER_BRIGHTNESS_MUL}
          transparent
          opacity={(isExpanded ? 0.24 : 0.17) * CENTER_BRIGHTNESS_MUL}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 12]} />
        <meshPhysicalMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={emissiveIntensity * (isExpanded ? 0.95 : 0.8) * CENTER_BRIGHTNESS_MUL}
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
          emissiveIntensity={emissiveIntensity * 0.2 * CLOUD_EMISSIVE_MUL * CENTER_BRIGHTNESS_MUL}
          transparent
          opacity={0.22 * CENTER_BRIGHTNESS_MUL}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={[1.24, 1.24, 1.24]}>
        <sphereGeometry args={[1, 56, 56]} />
        <FresnelMaterial
          color={atmosphereColor}
          power={fresnelPower}
          intensity={fresnelIntensity}
          alpha={0.5 * CENTER_BRIGHTNESS_MUL}
        />
      </mesh>

      <mesh ref={innerRingRef} rotation={[ringTilt, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 190]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={emissiveIntensity * 0.58 * RING_EMISSIVE_MUL * CENTER_BRIGHTNESS_MUL}
          transparent
          opacity={0.83 * CENTER_BRIGHTNESS_MUL}
          roughness={0.2}
          metalness={0.75}
        />
      </mesh>

      <mesh ref={outerRingRef} rotation={[ringTiltSecondary, 0, 0]}>
        <torusGeometry args={[1.82, 0.028, 16, 220]} />
        <meshStandardMaterial
          color={outerRingColor}
          emissive={outerRingColor}
          emissiveIntensity={emissiveIntensity * 0.42 * RING_EMISSIVE_MUL * CENTER_BRIGHTNESS_MUL}
          transparent
          opacity={0.64 * CENTER_BRIGHTNESS_MUL}
          roughness={0.32}
          metalness={0.52}
        />
      </mesh>

      {hoverAccentPlanetId && (
        <Billboard>
          <group ref={iconMorphRef} position={[0, 0, coreScale * 0.58]}>
            <mesh ref={iconGlowOuterRef} renderOrder={16}>
              <circleGeometry args={[1.25, 64]} />
              <meshBasicMaterial
                color={hoverAccentColor ?? "#f2f5ff"}
                transparent
                opacity={0}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
            <mesh ref={iconGlowInnerRef} renderOrder={17}>
              <circleGeometry args={[0.82, 64]} />
              <meshBasicMaterial
                color={hoverAccentColor ?? "#f2f5ff"}
                transparent
                opacity={0}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
            <PlanetIconAccent
              planetId={hoverAccentPlanetId}
              size={1}
              color={hoverAccentColor ?? "#f2f5ff"}
              layoutScale={1}
            />
          </group>
        </Billboard>
      )}

      {showCenterIotLabel && (
        <Billboard>
          <Text
            position={[0, 0, coreScale * 0.52]}
            fontSize={coreScale * 0.72}
            color="#f2f5ff"
            anchorX="center"
            anchorY="middle"
            renderOrder={20}
            outlineWidth={0.04}
            outlineColor="#070b14"
            material-depthTest={false}
          >
            IoT
          </Text>
        </Billboard>
      )}
    </group>
  );
}
