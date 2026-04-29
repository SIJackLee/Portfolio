"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, ThreeElement } from "@react-three/fiber";
import { Color } from "three";

const FresnelShaderMaterial = shaderMaterial(
  {
    uColor: new Color("#ffffff"),
    uPower: 2.0,
    uIntensity: 1.0,
    uAlpha: 0.4,
  },
  `
    varying vec3 vNormalW;
    varying vec3 vWorldPosition;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  `
    uniform vec3 uColor;
    uniform float uPower;
    uniform float uIntensity;
    uniform float uAlpha;

    varying vec3 vNormalW;
    varying vec3 vWorldPosition;

    void main() {
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(vNormalW, viewDirection), 0.0), uPower);
      float glow = fresnel * uIntensity;
      gl_FragColor = vec4(uColor * glow, min(glow * uAlpha, 1.0));
    }
  `
);

extend({ FresnelShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    fresnelShaderMaterial: ThreeElement<typeof FresnelShaderMaterial>;
  }
}

interface FresnelMaterialProps {
  color: string;
  power: number;
  intensity: number;
  alpha: number;
}

export function FresnelMaterial({
  color,
  power,
  intensity,
  alpha,
}: FresnelMaterialProps) {
  return (
    <fresnelShaderMaterial
      transparent
      depthWrite={false}
      uColor={new Color(color)}
      uPower={power}
      uIntensity={intensity}
      uAlpha={alpha}
    />
  );
}
