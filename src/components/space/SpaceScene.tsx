"use client";

import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { ReactNode, useRef } from "react";
import { Group, PerspectiveCamera } from "three";
import { CameraFocusController } from "@/components/space/CameraFocusController";
import { StarField } from "@/components/space/StarField";
import { GlowCore } from "@/components/space/GlowCore";
import { PostFx } from "@/components/space/PostFx";
import { LightRig } from "@/components/space/LightRig";
import { OrbitPlanets } from "@/components/space/OrbitPlanets";
import { InteractionMode, PlanetDomain } from "@/components/space/types";
import { spaceTheme } from "@/config/spaceTheme";

interface SpaceSceneProps {
  planets: PlanetDomain[];
  selectedPlanetId: PlanetDomain["id"] | null;
  hoveredPlanetId: PlanetDomain["id"] | null;
  interactionMode: InteractionMode;
  onHoverPlanet: (id: PlanetDomain["id"] | null) => void;
  onSelectPlanet: (id: PlanetDomain["id"]) => void;
  centralExpanded: boolean;
  onToggleCentralExpanded: () => void;
  expandScale: number;
}

function CameraDrift({ enabled }: { enabled: boolean }) {
  const cameraRef = useRef<PerspectiveCamera | null>(null);

  useFrame(({ camera, clock }) => {
    if (!cameraRef.current) {
      cameraRef.current = camera as PerspectiveCamera;
    }

    if (!enabled) return;

    const t = clock.getElapsedTime();
    camera.position.x += (Math.sin(t * 0.13) * 0.11 - camera.position.x) * 0.03;
    camera.position.y += (Math.cos(t * 0.16) * 0.09 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, -14);
  });

  return null;
}

function OrbitScaleGroup({
  expanded,
  expandScale,
  children,
}: {
  expanded: boolean;
  expandScale: number;
  children: ReactNode;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = expanded ? expandScale : 1;
    const current = groupRef.current.scale.x;
    const next = current + (target - current) * 0.08;
    groupRef.current.scale.setScalar(next);
  });

  return <group ref={groupRef}>{children}</group>;
}

export function SpaceScene({
  planets,
  selectedPlanetId,
  hoveredPlanetId,
  interactionMode,
  onHoverPlanet,
  onSelectPlanet,
  centralExpanded,
  onToggleCentralExpanded,
  expandScale,
}: SpaceSceneProps) {
  const isLowPower =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;
  const orbitPhaseRef = useRef(0);
  const selectedPlanet =
    planets.find((planet) => planet.id === selectedPlanetId) ?? null;
  const isFocusMode = interactionMode === "focus";
  const orbitAxisRotationDeg = 15;

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      dpr={isLowPower ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !isLowPower }}
      style={{ background: `linear-gradient(160deg, ${spaceTheme.background.deepSpace}, ${spaceTheme.background.deepSpaceAlt})` }}
    >
      <CameraDrift enabled={!isFocusMode || !selectedPlanet} />
      <CameraFocusController
        selectedPlanet={selectedPlanet}
        enabled={isFocusMode}
        totalPlanets={planets.length}
        radiusX={spaceTheme.orbit.radiusX}
        radiusY={spaceTheme.orbit.radiusY}
        axisRotationDeg={orbitAxisRotationDeg}
        orbitPhaseRef={orbitPhaseRef}
        orbitExpanded={centralExpanded}
        orbitExpandScale={expandScale}
      />
      <LightRig
        ambientIntensity={spaceTheme.lightRig.ambientIntensity}
        keyIntensity={
          isLowPower
            ? spaceTheme.lightRig.keyIntensity * 0.82
            : spaceTheme.lightRig.keyIntensity
        }
        keyColor={spaceTheme.lightRig.keyColor}
        keyPosition={spaceTheme.lightRig.keyPosition}
        rimIntensity={
          isLowPower
            ? spaceTheme.lightRig.rimIntensity * 0.8
            : spaceTheme.lightRig.rimIntensity
        }
        rimColor={spaceTheme.lightRig.rimColor}
        rimPosition={spaceTheme.lightRig.rimPosition}
        fillIntensity={spaceTheme.lightRig.fillIntensity}
        fillColor={spaceTheme.lightRig.fillColor}
        fillPosition={spaceTheme.lightRig.fillPosition}
      />

      <StarField {...spaceTheme.stars} />

      <OrbitScaleGroup expanded={centralExpanded} expandScale={expandScale}>
        <OrbitPlanets
          planets={planets}
          selectedId={selectedPlanetId}
          hoveredId={hoveredPlanetId}
          onHover={onHoverPlanet}
          onSelect={onSelectPlanet}
          radiusX={spaceTheme.orbit.radiusX}
          radiusY={spaceTheme.orbit.radiusY}
          nodeSize={spaceTheme.orbit.nodeSize}
          glowScale={spaceTheme.orbit.glowScale}
          hoverEmissiveBoost={spaceTheme.orbit.hoverEmissiveBoost}
          rotationSpeed={spaceTheme.orbit.rotationSpeed}
          axisRotationDeg={orbitAxisRotationDeg}
          orbitPhaseRef={orbitPhaseRef}
        />
      </OrbitScaleGroup>

      <GlowCore
        {...spaceTheme.glow}
        isExpanded={centralExpanded}
        onToggleExpand={onToggleCentralExpanded}
      />
      <PostFx
        bloomIntensity={isLowPower ? 0.8 : spaceTheme.postFx.bloomIntensity}
        bloomLuminanceThreshold={spaceTheme.postFx.bloomLuminanceThreshold}
        bloomLuminanceSmoothing={spaceTheme.postFx.bloomLuminanceSmoothing}
        noiseOpacity={isLowPower ? 0.03 : spaceTheme.postFx.noiseOpacity}
        chromaticAberrationOffset={
          isLowPower ? 0.0004 : spaceTheme.postFx.chromaticAberrationOffset
        }
      />
    </Canvas>
  );
}
