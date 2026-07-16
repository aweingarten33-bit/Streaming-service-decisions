"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, DepthOfField, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Theater } from "./chapters/theater";
import { PopcornField } from "./chapters/popcorn-field";
import { FlashAndTracks } from "./chapters/flash-and-tracks";
import { Finale } from "./chapters/finale";
import type { ScrollStore } from "./scroll-store";

// Locked Banksy tokens only -- never a second saturated hue baseline (the
// eras chapter is the one deliberate, content-justified exception, scoped
// entirely to its own shader/lighting).
const INK = "#0a0a0a";
const RED_INK = "#f5f0e6";
const INK_2 = "#4a483f";

// One continuous camera path spanning the whole page. Matches the named
// RANGES in scroll-store.ts -- each waypoint's fraction is (index / (N-1)).
const CAMERA_WAYPOINTS: { position: [number, number, number]; lookAt: [number, number, number] }[] =
  [
    { position: [0, 0.5, 4], lookAt: [0, -0.3, -2.5] }, // darkness: establishing shot
    { position: [0, 0.35, 1.2], lookAt: [0.1, 0.45, -2.5] }, // push toward the lens
    { position: [0.1, 0.5, -1.5], lookAt: [0.5, 0, -6] }, // through the lens, into the field
    { position: [1.2, 0.4, -6], lookAt: [2, -1, -10] }, // weaving among kernels
    { position: [0, 0, -12], lookAt: [0, -1, -18] }, // stretching toward the road
    { position: [0.5, -0.6, -16], lookAt: [0, -1.5, -22] }, // approaching the flash
    { position: [0, -1, -18], lookAt: [0, -1.5, -25] }, // the flash beat -- sharp, not glide-y
    { position: [1, -1, -25], lookAt: [0, -1.48, -30] }, // following the burning tracks
    { position: [2, 0, -15], lookAt: [0, -1.3, -22] }, // eras settle out
    { position: [3.2, 1.4, -4], lookAt: [0.5, -1, -18] }, // finale: wide, asymmetrical
  ];

function CameraRig({
  scrollStore,
  reducedMotion,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
}) {
  const posTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  useFrame(({ camera, pointer, clock }) => {
    const s = Math.max(0, Math.min(scrollStore.section, CAMERA_WAYPOINTS.length - 1));
    const i = Math.min(Math.floor(s), CAMERA_WAYPOINTS.length - 2);
    const f = s - i;
    const a = CAMERA_WAYPOINTS[i];
    const b = CAMERA_WAYPOINTS[i + 1];

    posTarget.current.set(
      THREE.MathUtils.lerp(a.position[0], b.position[0], f),
      THREE.MathUtils.lerp(a.position[1], b.position[1], f),
      THREE.MathUtils.lerp(a.position[2], b.position[2], f),
    );
    lookTarget.current.set(
      THREE.MathUtils.lerp(a.lookAt[0], b.lookAt[0], f),
      THREE.MathUtils.lerp(a.lookAt[1], b.lookAt[1], f),
      THREE.MathUtils.lerp(a.lookAt[2], b.lookAt[2], f),
    );

    // The flash beat (waypoint index 6) is the one moment camera motion
    // should read as a reactive snap, not a smooth glide -- everywhere else,
    // idle drift + pointer parallax layer on top.
    const isFlashBeat = i === 6;
    if (!reducedMotion && !isFlashBeat) {
      const t = clock.getElapsedTime();
      posTarget.current.x += Math.sin(t * 0.15) * 0.2 + pointer.x * 0.25;
      posTarget.current.y += Math.cos(t * 0.12) * 0.12 + pointer.y * 0.12;
    }

    const lerpFactor = reducedMotion ? 1 : isFlashBeat ? 0.18 : 0.055;
    camera.position.lerp(posTarget.current, lerpFactor);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

export function HeroScene({
  scrollStore,
  reducedMotion,
  mobileTier,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
  mobileTier: boolean;
}) {
  return (
    <Canvas
      dpr={mobileTier ? [1, 1] : [1, 1.5]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0.5, 4], fov: 50 }}
    >
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 8, 38]} />

      <ambientLight intensity={0.3} color={INK_2} />
      <directionalLight position={[4, 6, 3]} intensity={0.5} color={RED_INK} />

      <Theater scrollStore={scrollStore} reducedMotion={reducedMotion} mobileTier={mobileTier} />
      <PopcornField
        scrollStore={scrollStore}
        reducedMotion={reducedMotion}
        mobileTier={mobileTier}
      />
      <FlashAndTracks
        scrollStore={scrollStore}
        reducedMotion={reducedMotion}
        mobileTier={mobileTier}
      />
      <Finale scrollStore={scrollStore} reducedMotion={reducedMotion} />

      <CameraRig scrollStore={scrollStore} reducedMotion={reducedMotion} />

      {!reducedMotion && !mobileTier && (
        <EffectComposer multisampling={0}>
          <DepthOfField focusDistance={0.015} focalLength={0.045} bokehScale={2.2} height={480} />
          <Bloom intensity={0.35} luminanceThreshold={0.35} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
