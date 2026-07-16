"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { remap } from "@/lib/landing/scroll-range";
import { RANGES, type ScrollStore } from "../scroll-store";
import { AtmosphereParticles } from "../atmosphere-particles";
import { TRACK_VERTEX, TRACK_FRAGMENT } from "../shaders/track-material";

/**
 * No vehicle, no character -- per the brief, only a violent fog
 * displacement, a fleeting flash, and what's left behind: two burning
 * tracks whose material morphs continuously through six film eras as the
 * camera follows them. That morph *is* the "journey through cinema
 * history" -- no separate tunnel, no slideshow.
 */
export function FlashAndTracks({
  scrollStore,
  reducedMotion,
  mobileTier,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
  mobileTier: boolean;
}) {
  const flashLightRef = useRef<THREE.PointLight>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwaveMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trackMatARef = useRef<THREE.ShaderMaterial>(null);
  const trackMatBRef = useRef<THREE.ShaderMaterial>(null);

  const trackUniformsA = useMemo(
    () => ({ uEra: { value: 0 }, uTime: { value: 0 }, uIntensity: { value: 0 } }),
    [],
  );
  const trackUniformsB = useMemo(
    () => ({ uEra: { value: 0 }, uTime: { value: 0 }, uIntensity: { value: 0 } }),
    [],
  );

  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    const flashProgress = remap(scrollStore.progress, ...RANGES.flash);
    const erasProgress = remap(scrollStore.progress, ...RANGES.eras);
    const era = erasProgress * 5;

    const flashSpike = reducedMotion ? 0 : Math.max(0, 1 - Math.abs(flashProgress - 0.15) * 6);
    if (flashLightRef.current) flashLightRef.current.intensity = flashSpike * 80;

    if (shockwaveRef.current && shockwaveMatRef.current) {
      const wave = Math.max(0, flashProgress - 0.15) * 3;
      shockwaveRef.current.scale.setScalar(1 + wave * 8);
      shockwaveMatRef.current.opacity = reducedMotion ? 0 : Math.max(0, 0.6 - wave * 0.6);
    }

    const trackIn = remap(scrollStore.progress, RANGES.flash[1] - 0.02, RANGES.flash[1] + 0.03);
    const trackOut = 1 - remap(scrollStore.progress, RANGES.eras[1] - 0.05, RANGES.eras[1]);
    const intensity = Math.min(trackIn, trackOut);

    for (const matRef of [trackMatARef, trackMatBRef]) {
      const uniforms = matRef.current?.uniforms;
      if (!uniforms) continue;
      uniforms.uEra.value = era;
      uniforms.uTime.value = t;
      uniforms.uIntensity.value = intensity;
    }
  });

  return (
    <group position={[0, -1.5, -20]}>
      <pointLight
        ref={flashLightRef}
        position={[0, 3, 2]}
        color="#ffffff"
        distance={30}
        decay={1.5}
      />

      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.8, 32]} />
        <meshBasicMaterial
          ref={shockwaveMatRef}
          color="#ffffff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[10, 30]} />
        <MeshReflectorMaterial
          blur={mobileTier ? [0, 0] : [200, 80]}
          resolution={mobileTier ? 256 : 512}
          mixBlur={1}
          mixStrength={30}
          roughness={0.9}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#0a0a0a"
          metalness={0.3}
        />
      </mesh>

      {/* The tracks themselves are cheap (two plane shaders) -- always
          render them. Only the reflective road's framebuffer cost is
          gated by mobileTier, above. */}
      <mesh position={[-0.6, 0.02, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 24]} />
        <shaderMaterial
          ref={trackMatARef}
          vertexShader={TRACK_VERTEX}
          fragmentShader={TRACK_FRAGMENT}
          uniforms={trackUniformsA}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0.6, 0.02, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 24]} />
        <shaderMaterial
          ref={trackMatBRef}
          vertexShader={TRACK_VERTEX}
          fragmentShader={TRACK_FRAGMENT}
          uniforms={trackUniformsB}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <AtmosphereParticles
        count={mobileTier ? 15 : 35}
        color="#f5f0e6"
        opacity={0.25}
        bounds={[12, 5, 20]}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}
