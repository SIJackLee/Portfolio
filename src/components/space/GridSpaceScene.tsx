"use client";

import { Billboard, Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group } from "three";
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

function WormholeTunnel() {
  const rootRef = useRef<Group>(null);
  const ringRefs = useRef<Array<Group | null>>([]);
  const rings = useMemo(() => {
    const count = 30;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      depthT: i / (count - 1),
    }));
  }, []);
  const radialLines = useMemo(() => {
    const spokes = 20;
    return Array.from({ length: spokes }, (_, s) => {
      const theta = (s / spokes) * Math.PI * 2;
      const points: [number, number, number][] = [];
      const samples = 44;
      for (let i = 0; i <= samples; i += 1) {
        const t = i / samples;
        // Outer wide disk -> center sink
        const r = 12.4 * (1 - t * 0.92);
        const sink = -Math.pow(t, 1.65) * 5.4;
        points.push([Math.cos(theta) * r, sink, Math.sin(theta) * r]);
      }
      return points;
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (rootRef.current) {
      rootRef.current.rotation.y = Math.sin(t * 0.16) * 0.06;
    }
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.y = t * (0.08 + i * 0.0018) * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={rootRef} position={[0, -2.45, -18]} rotation={[0.36, 0, 0]}>
      {rings.map((ring, i) => (
        <group
          key={ring.id}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          position={[0, -Math.pow(ring.depthT, 1.5) * 5.4, 0]}
          scale={1 - ring.depthT * 0.92}
        >
          <mesh>
            <torusGeometry args={[12.4, 0.028, 10, 112]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#5f77d8" : "#7b57dc"}
              transparent
              opacity={Math.max(0.1, 0.34 - ring.depthT * 0.22)}
            />
          </mesh>
        </group>
      ))}
      {radialLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#6d85e8"
          lineWidth={0.75}
          transparent
          opacity={0.3}
        />
      ))}
      <mesh position={[0, -5.36, 0]}>
        <circleGeometry args={[1.26, 48]} />
        <meshBasicMaterial color="#5af0ff" transparent opacity={0.62} />
      </mesh>
      <mesh position={[0, -5.42, 0]}>
        <circleGeometry args={[2.24, 56]} />
        <meshBasicMaterial color="#73c9ff" transparent opacity={0.2} />
      </mesh>
    </group>
  );
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
      <WormholeTunnel />

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
