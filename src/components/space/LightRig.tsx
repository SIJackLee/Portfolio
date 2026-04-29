"use client";

interface LightRigProps {
  ambientIntensity: number;
  keyIntensity: number;
  keyColor: string;
  keyPosition: [number, number, number];
  rimIntensity: number;
  rimColor: string;
  rimPosition: [number, number, number];
  fillIntensity: number;
  fillColor: string;
  fillPosition: [number, number, number];
}

export function LightRig({
  ambientIntensity,
  keyIntensity,
  keyColor,
  keyPosition,
  rimIntensity,
  rimColor,
  rimPosition,
  fillIntensity,
  fillColor,
  fillPosition,
}: LightRigProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <pointLight
        color={keyColor}
        intensity={keyIntensity}
        distance={30}
        decay={1.8}
        position={keyPosition}
      />
      <pointLight
        color={rimColor}
        intensity={rimIntensity}
        distance={28}
        decay={2}
        position={rimPosition}
      />
      <pointLight
        color={fillColor}
        intensity={fillIntensity}
        distance={22}
        decay={1.6}
        position={fillPosition}
      />
    </>
  );
}
