"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { remap } from "@/lib/landing/scroll-range";
import { RANGES, type ScrollStore } from "../scroll-store";

const RED = "#d81e2c";
const RED_INK = "#f5f0e6";

/**
 * The projector and popcorn cup are already permanent parts of this one
 * continuous world (Theater/PopcornField, never mounted/unmounted) -- the
 * "asymmetrical composition" is a camera-choreography concern, not
 * something this component needs to rebuild. Finale itself is just the
 * closing light: the projector's beam switches on once more and lands
 * where the burning tracks used to be.
 */
export function Finale({
  scrollStore,
  reducedMotion,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
}) {
  const poolRef = useRef<THREE.PointLight>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    const finaleProgress = remap(scrollStore.progress, ...RANGES.finale);
    const breathe = reducedMotion ? 1 : 0.9 + Math.sin(t * 0.5) * 0.1;

    if (poolRef.current) {
      poolRef.current.intensity = finaleProgress * 18 * breathe + scrollStore.hoverBoost * 14;
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = finaleProgress * 0.5 * breathe;
    }
  });

  return (
    <group position={[0, -1.3, -22]}>
      <pointLight ref={poolRef} color={RED_INK} distance={10} decay={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={RED}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
