"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { remap } from "@/lib/landing/scroll-range";
import { RANGES, type ScrollStore } from "../scroll-store";
import { AtmosphereParticles } from "../atmosphere-particles";
import { BEAM_VERTEX, BEAM_FRAGMENT } from "../shaders/beam-material";

const WARM_BULB = "#ffb066";

/**
 * The source .dae is a single fused mesh -- there's no separate reel/body
 * rigging to animate independently, so the projector body stays static and
 * "aliveness" comes from lighting (bulb flicker), a subtle mechanical
 * vibration on the whole object, the beam, and dust. Honest to what the
 * asset actually supports rather than faking rigged sub-parts.
 */
export function Theater({
  scrollStore,
  reducedMotion,
  mobileTier,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
  mobileTier: boolean;
}) {
  const { scene } = useGLTF("/models/projector.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const projectorRef = useRef<THREE.Group>(null);
  const bulbRef = useRef<THREE.PointLight>(null);
  const beamMatRef = useRef<THREE.ShaderMaterial>(null);
  const flickerSeed = useRef(Math.random() * 100);

  const beamUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(WARM_BULB) },
    }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const revealProgress = remap(scrollStore.progress, ...RANGES.darkness);
    const beamProgress = remap(scrollStore.progress, ...RANGES.lensPush);
    const presence = Math.max(revealProgress, beamProgress);

    if (projectorRef.current && !reducedMotion) {
      projectorRef.current.position.y =
        Math.sin(t * 37 + flickerSeed.current) * 0.0025 * revealProgress;
      projectorRef.current.rotation.z = Math.sin(t * 23) * 0.0015 * revealProgress;
    }

    if (bulbRef.current) {
      let flicker = 1;
      if (!reducedMotion) {
        flicker = 0.75 + 0.25 * Math.sin(t * 14 + flickerSeed.current) * (1 - revealProgress * 0.6);
        if (Math.random() < 0.002) flicker *= 0.3;
      }
      bulbRef.current.intensity = 6 * presence * flicker;
    }

    if (beamMatRef.current) {
      beamMatRef.current.uniforms.uTime.value = reducedMotion ? 0 : t;
      beamMatRef.current.uniforms.uIntensity.value = beamProgress;
    }
  });

  return (
    <group position={[0, -0.3, -2.5]}>
      <group ref={projectorRef}>
        <primitive object={clonedScene} scale={1.4} />
      </group>

      <pointLight
        ref={bulbRef}
        position={[0.1, 0.55, 0.75]}
        color={WARM_BULB}
        distance={4}
        decay={2}
      />

      <mesh position={[0.1, 0.55, -5.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 2.2, 12, 24, 1, true]} />
        <shaderMaterial
          ref={beamMatRef}
          vertexShader={BEAM_VERTEX}
          fragmentShader={BEAM_FRAGMENT}
          uniforms={beamUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <AtmosphereParticles
        count={mobileTier ? 25 : 70}
        color={WARM_BULB}
        opacity={0.3}
        bounds={[6, 4, 10]}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}

useGLTF.preload("/models/projector.glb");
