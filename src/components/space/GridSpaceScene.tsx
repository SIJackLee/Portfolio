"use client";

import { Billboard, Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { PlanetIconAccent } from "@/components/space/PlanetIconAccent";
import { InteractionMode, PlanetDomain } from "@/components/space/types";
import { LightRig } from "@/components/space/LightRig";
import { PostFx } from "@/components/space/PostFx";
import { StarField } from "@/components/space/StarField";
import { spaceTheme } from "@/config/spaceTheme";

interface GridSpaceSceneProps {
  planets: PlanetDomain[];
  selectedPlanetId: PlanetDomain["id"] | null;
  interactionMode: InteractionMode;
  onSelectPlanet: (id: PlanetDomain["id"]) => void;
}

function GridIconField({
  planets,
  selectedPlanetId,
  onSelectPlanet,
}: {
  planets: PlanetDomain[];
  selectedPlanetId: PlanetDomain["id"] | null;
  onSelectPlanet: (id: PlanetDomain["id"]) => void;
}) {
  const selectedPlanet = useMemo(
    () => planets.find((planet) => planet.id === selectedPlanetId) ?? null,
    [planets, selectedPlanetId]
  );

  if (!selectedPlanet) return null;

  return (
    <group>
      <group
        position={[0, 0, -12]}
        onClick={(event) => {
          event.stopPropagation();
          onSelectPlanet(selectedPlanet.id);
        }}
      >
        <Billboard>
          <group position={[0, 0, 0.36]} scale={1.28}>
            <PlanetIconAccent
              planetId={selectedPlanet.id}
              size={1}
              color={selectedPlanet.color}
              layoutScale={1}
            />
          </group>
        </Billboard>
      </group>
    </group>
  );
}

export function GridSpaceScene({
  planets,
  selectedPlanetId,
  interactionMode,
  onSelectPlanet,
}: GridSpaceSceneProps) {
  const isLowPower =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      dpr={isLowPower ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !isLowPower }}
      style={{
        background: `linear-gradient(160deg, ${spaceTheme.background.deepSpace}, ${spaceTheme.background.deepSpaceAlt})`,
      }}
    >
      <LightRig
        ambientIntensity={spaceTheme.lightRig.ambientIntensity}
        keyIntensity={spaceTheme.lightRig.keyIntensity}
        keyColor={spaceTheme.lightRig.keyColor}
        keyPosition={spaceTheme.lightRig.keyPosition}
        rimIntensity={spaceTheme.lightRig.rimIntensity}
        rimColor={spaceTheme.lightRig.rimColor}
        rimPosition={spaceTheme.lightRig.rimPosition}
        fillIntensity={spaceTheme.lightRig.fillIntensity}
        fillColor={spaceTheme.lightRig.fillColor}
        fillPosition={spaceTheme.lightRig.fillPosition}
      />
      <StarField {...spaceTheme.stars} />

      <Grid
        position={[0, -1.3, -15]}
        args={[40, 24]}
        cellSize={1.2}
        cellThickness={0.5}
        cellColor="#3861b0"
        sectionSize={4.8}
        sectionThickness={1}
        sectionColor="#7aa6ff"
        fadeDistance={52}
        fadeStrength={1.25}
        infiniteGrid
      />

      <GridIconField
        planets={planets}
        selectedPlanetId={interactionMode === "focus" ? selectedPlanetId : null}
        onSelectPlanet={onSelectPlanet}
      />

      <PostFx
        bloomIntensity={isLowPower ? 0.62 : 0.78}
        bloomLuminanceThreshold={0.24}
        bloomLuminanceSmoothing={0.34}
        noiseOpacity={isLowPower ? 0.03 : spaceTheme.postFx.noiseOpacity}
        chromaticAberrationOffset={isLowPower ? 0.00035 : spaceTheme.postFx.chromaticAberrationOffset}
      />
    </Canvas>
  );
}
