"use client";

import { Stars } from "@react-three/drei";

interface StarFieldProps {
  count: number;
  depth: number;
  radius: number;
  saturation: number;
  speed: number;
}

export function StarField({
  count,
  depth,
  radius,
  saturation,
  speed,
}: StarFieldProps) {
  return (
    <Stars
      radius={radius}
      depth={depth}
      count={count}
      saturation={saturation}
      factor={4}
      fade
      speed={speed}
    />
  );
}
