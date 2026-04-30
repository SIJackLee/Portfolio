"use client";

import { Billboard } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { spaceTheme } from "@/config/spaceTheme";
import { DEFAULT_ICON_TUNING, ORBIT_ICON_LAYOUT_SCALE_MIN } from "@/components/space/iconTuning";
import { PlanetIconAccent } from "@/components/space/PlanetIconAccent";
import { FocusMergeRole, PlanetDomain } from "@/components/space/types";

/** Low icosahedron emissive so aura/core bloom read as the main “mystery” glow. */
const CORE_EMISSIVE_BASE = 0.46;

/** When leaving focus target, icon reveal fades out (per second toward 0). */
const ICON_REVEAL_OUT_LERP = 8.5;

/**
 * Shared 0→1 progress per second while focus target: same driver for sphere shrink leg and icon scale/color.
 */
/** ~0.2s longer full intro vs prior (1/1.58 ≈ 0.63s to reach 1 at 60fps-equivalent dt). */
const INTRO_SYNC_IN_SPEED = 1.58;
const INTRO_SYNC_OUT_SPEED = 2.05;
/** Final icon pack scale = `intro * ICON_SCALE_WITH_INTRO` (linear in `intro`, matched to sphere intro leg). */
const ICON_SCALE_WITH_INTRO = 1.08;

/** After focus target, wait before sphere/icon intro (selection & camera stay immediate). */
const PLANET_VISUAL_DELAY_MS = 100;

/** Per-planet icosahedron orientation + material so specular / bloom read differently per domain. */
const CORE_GLOW_IDENTITY: Record<
  PlanetDomain["id"],
  {
    euler: [number, number, number];
    metalness: number;
    roughness: number;
    emissiveMul: number;
  }
> = {
  simulation: {
    euler: [0.95, 1.15, 0.42],
    metalness: 0.56,
    roughness: 0.34,
    emissiveMul: 1.02,
  },
  circuit: {
    euler: [2.05, 0.35, 1.62],
    metalness: 0.74,
    roughness: 0.19,
    emissiveMul: 1.08,
  },
  protocol: {
    euler: [0.4, 2.5, 0.88],
    metalness: 0.62,
    roughness: 0.28,
    emissiveMul: 0.96,
  },
  server: {
    euler: [1.72, 0.95, 2.2],
    metalness: 0.68,
    roughness: 0.22,
    emissiveMul: 1.12,
  },
  db: {
    euler: [2.35, 1.5, 0.25],
    metalness: 0.52,
    roughness: 0.36,
    emissiveMul: 0.94,
  },
  web: {
    euler: [0.55, 0.2, 1.95],
    metalness: 0.7,
    roughness: 0.24,
    emissiveMul: 1.06,
  },
  "data-engineering": {
    euler: [1.1, 2.25, 1.35],
    metalness: 0.6,
    roughness: 0.3,
    emissiveMul: 1.0,
  },
  ai: {
    euler: [2.65, 0.65, 0.5],
    metalness: 0.78,
    roughness: 0.18,
    emissiveMul: 1.14,
  },
};

/** Icon anchor offset ratios (same basis as `PlanetNode` useFrame: 1.28 + oz along view, ox/oy tangent). */
const ICON_BASE_DEPTH_RATIO = 1.28;

/** Uniform scale for all orbit domain icons vs tuned layout cap (glyph + anchor clamp stay consistent). */
const ORBIT_ICON_SIZE_MUL = 0.8;

/**
 * Clamp `layoutScale` so billboard half-extent (≈ size × scale × theme.orbitIconHalfExtentPerLayoutScale)
 * stays inside the aura sphere (radius size × glowScale) for the given offsets.
 */
function clampIconLayoutScale(args: {
  layoutScale: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  glowScale: number;
}): number {
  const { orbitIconHalfExtentPerLayoutScale: he, orbitIconSphereInset: inset } = spaceTheme.orbit;
  const d0 = Math.hypot(ICON_BASE_DEPTH_RATIO + args.offsetZ, args.offsetX, args.offsetY);
  const tangentRatio = Math.sqrt(Math.max(0, args.glowScale * args.glowScale - d0 * d0));
  if (tangentRatio <= 0 || he <= 0) {
    return Math.min(args.layoutScale, ORBIT_ICON_LAYOUT_SCALE_MIN);
  }
  const scaleCap = (tangentRatio * inset) / he;
  return Math.min(args.layoutScale, Math.max(ORBIT_ICON_LAYOUT_SCALE_MIN, scaleCap));
}

interface PlanetNodeProps {
  planet: PlanetDomain;
  position: [number, number, number];
  size: number;
  glowScale: number;
  isHovered: boolean;
  isSelected: boolean;
  hoverEmissiveBoost: number;
  mergeProgressRef: MutableRefObject<number>;
  focusMergeRole: FocusMergeRole;
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
  mergeProgressRef,
  focusMergeRole,
  onHover,
  onSelect,
}: PlanetNodeProps) {
  const iconLayout = DEFAULT_ICON_TUNING[planet.id];
  const { camera } = useThree();
  const nodeGroupRef = useRef<Group>(null);
  const coreTiltRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const auraRef = useRef<Mesh>(null);
  const iconPackRef = useRef<Group>(null);
  /** Focus target: sphere shrink + icon scale/color share this 0→1 ramp (`introSyncRef`). */
  const iconRevealRef = useRef(0);
  const introSyncRef = useRef(0);
  const introVisualReadyRef = useRef(false);

  useEffect(() => {
    if (focusMergeRole === "target") {
      introVisualReadyRef.current = false;
      introSyncRef.current = 0;
      const id = window.setTimeout(() => {
        introVisualReadyRef.current = true;
      }, PLANET_VISUAL_DELAY_MS);
      return () => {
        window.clearTimeout(id);
        introVisualReadyRef.current = false;
      };
    }
    introVisualReadyRef.current = false;
    return undefined;
  }, [focusMergeRole]);

  const iconCamTmp = useRef({
    planet: new Vector3(),
    toward: new Vector3(),
    right: new Vector3(),
    upPlane: new Vector3(),
    world: new Vector3(),
    local: new Vector3(),
  });

  const coreIdentity = CORE_GLOW_IDENTITY[planet.id];

  const cappedIconLayoutScale = useMemo(
    () =>
      clampIconLayoutScale({
        layoutScale: iconLayout.scale,
        offsetX: iconLayout.offsetX,
        offsetY: iconLayout.offsetY,
        offsetZ: iconLayout.offsetZ,
        glowScale,
      }),
    [
      glowScale,
      iconLayout.offsetX,
      iconLayout.offsetY,
      iconLayout.offsetZ,
      iconLayout.scale,
    ]
  );

  const orbitIconLayoutScale = cappedIconLayoutScale * ORBIT_ICON_SIZE_MUL;

  const emissiveScale = isHovered || isSelected ? hoverEmissiveBoost : 1;
  const isAccentInteractive = isHovered || isSelected;

  const coreMaterialProps = useMemo(
    () => ({
      metalness: coreIdentity.metalness,
      roughness: coreIdentity.roughness,
      emissiveIntensity:
        CORE_EMISSIVE_BASE *
        emissiveScale *
        coreIdentity.emissiveMul *
        (isAccentInteractive ? 0.72 : 1),
    }),
    [
      coreIdentity.emissiveMul,
      coreIdentity.metalness,
      coreIdentity.roughness,
      emissiveScale,
      isAccentInteractive,
    ]
  );

  const baseAuraOpacity = isSelected ? 0.28 : 0.2;
  const baseAuraEmissive = 1.55 * emissiveScale * (isAccentInteractive ? 0.86 : 1);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const isActive = isHovered || isSelected;
    const speed = isActive ? 1.4 : 1;
    const targetScale = isActive ? 1.12 : 1;

    if (nodeGroupRef.current) {
      const current = nodeGroupRef.current.scale.x;
      const next = current + (targetScale - current) * 0.14;
      nodeGroupRef.current.scale.setScalar(next);
    }

    const mp = mergeProgressRef.current;
    const ease = mp * mp * (3 - 2 * mp);
    const fm = spaceTheme.orbit.focusMerge;

    if (focusMergeRole === "target") {
      if (introVisualReadyRef.current) {
        introSyncRef.current = Math.min(1, introSyncRef.current + delta * INTRO_SYNC_IN_SPEED);
      } else {
        introSyncRef.current = 0;
      }
    } else {
      introSyncRef.current = Math.max(0, introSyncRef.current - delta * INTRO_SYNC_OUT_SPEED);
    }
    const intro = introSyncRef.current;

    let auraShrink = 1;
    let auraOpacityMul = 1;
    let coreShrink = 1;
    let iconPopMul = 1;
    let peerMul = 1;

    /** Until visual delay elapses, hold merge-driven shrink so sphere/icon stay idle together. */
    const mergeLeg =
      focusMergeRole === "target" && !introVisualReadyRef.current ? 0 : ease;
    const shrinkBlend =
      focusMergeRole === "target" ? Math.max(mergeLeg, intro) : ease;

    if (focusMergeRole === "target") {
      auraShrink = 1 - 0.9 * shrinkBlend;
      auraOpacityMul = 1 - 0.94 * shrinkBlend;
      coreShrink = 1 - 0.82 * shrinkBlend;
      iconPopMul = ICON_SCALE_WITH_INTRO;
    } else if (focusMergeRole === "peer") {
      peerMul = 1 - fm.peerDimStrength * mp;
      auraOpacityMul = peerMul;
    }

    if (coreRef.current) {
      coreRef.current.rotation.y += 0.01 * speed;
      coreRef.current.rotation.x += 0.003 * speed;
    }

    const pulse = 1 + Math.sin(t * 1.2) * 0.07;

    /** Camera-facing icon anchor + core pull (coreTilt local space). */
    let iconAnchorReady = false;
    if (nodeGroupRef.current && coreTiltRef.current && iconPackRef.current) {
      const tmp = iconCamTmp.current;
      nodeGroupRef.current.getWorldPosition(tmp.planet);
      tmp.toward.copy(camera.position).sub(tmp.planet);
      const td = tmp.toward.length();
      if (td > 1e-8) tmp.toward.multiplyScalar(1 / td);
      else tmp.toward.set(0, 0, 1);

      tmp.right.crossVectors(camera.up, tmp.toward);
      if (tmp.right.lengthSq() < 1e-10) {
        tmp.right.set(1, 0, 0).cross(tmp.toward);
      }
      tmp.right.normalize();
      tmp.upPlane.crossVectors(tmp.toward, tmp.right).normalize();

      const baseZ = ICON_BASE_DEPTH_RATIO + iconLayout.offsetZ;
      const { orbitIconHalfExtentPerLayoutScale: he, orbitIconSphereInset: sphereInset } = spaceTheme.orbit;
      const sphereR = size * glowScale * sphereInset;
      const glyphHalf = size * orbitIconLayoutScale * he;
      const lenMax = Math.sqrt(Math.max(0, sphereR * sphereR - glyphHalf * glyphHalf));

      tmp.world
        .copy(tmp.toward)
        .multiplyScalar(baseZ * size)
        .addScaledVector(tmp.right, iconLayout.offsetX * size)
        .addScaledVector(tmp.upPlane, iconLayout.offsetY * size);

      const offLen = tmp.world.length();
      if (lenMax > 1e-6 && offLen > lenMax) {
        tmp.world.multiplyScalar(lenMax / offLen);
      } else if (lenMax <= 1e-6) {
        tmp.world.set(0, 0, 0);
      }

      tmp.local.copy(tmp.planet).add(tmp.world);
      coreTiltRef.current.worldToLocal(tmp.local);
      iconPackRef.current.position.copy(tmp.local);
      iconAnchorReady = true;

      if (focusMergeRole === "target" && coreRef.current && shrinkBlend > 0.001) {
        const pull = 0.44 * shrinkBlend;
        coreRef.current.position.set(tmp.local.x * pull, tmp.local.y * pull, tmp.local.z * pull);
      } else if (coreRef.current) {
        coreRef.current.position.set(0, 0, 0);
      }
    } else if (coreRef.current) {
      coreRef.current.position.set(0, 0, 0);
    }

    if (auraRef.current) {
      const auraMat = auraRef.current.material as MeshStandardMaterial;
      auraRef.current.scale.setScalar(glowScale * pulse * auraShrink);
      auraMat.opacity = baseAuraOpacity * auraOpacityMul;
      auraMat.emissiveIntensity =
        baseAuraEmissive * (focusMergeRole === "target" ? 1 - 0.55 * shrinkBlend : 1) * peerMul;
    }

    if (coreRef.current) {
      coreRef.current.scale.setScalar(coreShrink);
      const coreMat = coreRef.current.material as MeshStandardMaterial;
      let em = coreMaterialProps.emissiveIntensity;
      if (focusMergeRole === "target") em *= 1 - 0.48 * shrinkBlend;
      em *= peerMul;
      coreMat.emissiveIntensity = em;
    }

    if (focusMergeRole === "target") {
      iconRevealRef.current = intro;
    } else {
      const r = iconRevealRef.current;
      iconRevealRef.current = r + (0 - r) * Math.min(1, delta * ICON_REVEAL_OUT_LERP);
    }
    if (iconPackRef.current) {
      const v = iconRevealRef.current;
      iconPackRef.current.visible = v > 0.008 && iconAnchorReady;
      iconPackRef.current.scale.setScalar(Math.max(0.0001, v * iconPopMul));
    }
  });

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
          emissiveIntensity={baseAuraEmissive}
          transparent
          opacity={baseAuraOpacity}
          depthWrite={false}
        />
      </mesh>
      <group ref={coreTiltRef} rotation={coreIdentity.euler}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[size * 0.6, 8]} />
          <meshStandardMaterial
            color={planet.color}
            emissive={planet.color}
            emissiveIntensity={coreMaterialProps.emissiveIntensity}
            metalness={coreMaterialProps.metalness}
            roughness={coreMaterialProps.roughness}
          />
        </mesh>
        <group ref={iconPackRef} visible={false}>
          <Billboard>
            <PlanetIconAccent
              planetId={planet.id}
              size={size}
              color={planet.color}
              layoutScale={orbitIconLayoutScale}
            />
          </Billboard>
        </group>
      </group>
    </group>
  );
}
