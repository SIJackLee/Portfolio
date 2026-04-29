"use client";

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface PostFxProps {
  bloomIntensity: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  noiseOpacity: number;
  chromaticAberrationOffset: number;
}

export function PostFx({
  bloomIntensity,
  bloomLuminanceThreshold,
  bloomLuminanceSmoothing,
  noiseOpacity,
  chromaticAberrationOffset,
}: PostFxProps) {
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomLuminanceThreshold}
        luminanceSmoothing={bloomLuminanceSmoothing}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[chromaticAberrationOffset, chromaticAberrationOffset * 0.5]}
      />
      <Noise opacity={noiseOpacity} />
    </EffectComposer>
  );
}
