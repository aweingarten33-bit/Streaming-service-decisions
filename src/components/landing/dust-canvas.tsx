"use client";

import { Canvas } from "@react-three/fiber";
import { CanvasErrorBoundary } from "@/components/landing/canvas-error-boundary";
import HeroScene from "@/components/landing/hero-scene";

/** Isolated so `next/dynamic(..., { ssr: false })` can keep three.js out of
 * the initial /welcome bundle entirely until this actually mounts. */
export function DustCanvas() {
  return (
    <CanvasErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: false, alpha: true, failIfMajorPerformanceCaveat: false }}
      >
        <HeroScene />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
