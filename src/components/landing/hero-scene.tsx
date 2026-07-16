"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, DepthOfField, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { FloatingPoster, type PosterConfig } from "./floating-poster";
import { AtmosphereParticles } from "./atmosphere-particles";
import type { ScrollStore } from "./scroll-store";

// Locked Banksy tokens only (globals.css) -- never a second saturated hue.
const INK = "#0a0a0a";
const RED_INK = "#f5f0e6";
const RED = "#d81e2c";
const INK_2 = "#4a483f";

const POSTERS: PosterConfig[] = [
  {
    position: [-3.4, 1.3, -8],
    size: [1.1, 1.65],
    accent: false,
    floatSpeed: 0.5,
    floatIntensity: 0.5,
    rotationIntensity: 0.25,
    parallax: 0.15,
  },
  {
    position: [3.1, -1.0, -7],
    size: [1.2, 1.8],
    accent: false,
    floatSpeed: 0.6,
    floatIntensity: 0.6,
    rotationIntensity: 0.3,
    parallax: 0.18,
  },
  {
    position: [-1.6, -1.7, -5.4],
    size: [1.3, 1.95],
    accent: false,
    floatSpeed: 0.45,
    floatIntensity: 0.55,
    rotationIntensity: 0.2,
    parallax: 0.26,
  },
  {
    position: [2.0, 1.6, -4.4],
    size: [1.4, 2.1],
    accent: true,
    floatSpeed: 0.55,
    floatIntensity: 0.6,
    rotationIntensity: 0.3,
    parallax: 0.32,
  },
  {
    position: [-3.6, -0.4, -3.2],
    size: [1.5, 2.25],
    accent: false,
    floatSpeed: 0.5,
    floatIntensity: 0.65,
    rotationIntensity: 0.25,
    parallax: 0.4,
  },
  {
    position: [0.3, -2.1, -2.4],
    size: [1.5, 2.25],
    accent: false,
    floatSpeed: 0.6,
    floatIntensity: 0.6,
    rotationIntensity: 0.3,
    parallax: 0.46,
  },
  {
    position: [3.6, 0.7, -1.4],
    size: [1.7, 2.55],
    accent: false,
    floatSpeed: 0.45,
    floatIntensity: 0.7,
    rotationIntensity: 0.35,
    parallax: 0.55,
  },
  {
    position: [-1.2, 1.9, -0.6],
    size: [1.7, 2.55],
    accent: true,
    floatSpeed: 0.5,
    floatIntensity: 0.7,
    rotationIntensity: 0.3,
    parallax: 0.62,
  },
];

const CAMERA_WAYPOINTS: { position: [number, number, number]; lookAt: [number, number, number] }[] =
  [
    { position: [0, 0, 9], lookAt: [0, 0, -3] },
    { position: [-1.6, 0.6, 4], lookAt: [0.6, -0.2, -4] },
    { position: [1.2, -0.5, 1], lookAt: [-0.4, 0.3, -5] },
  ];

function CameraRig({
  scrollStore,
  reducedMotion,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
}) {
  const posTarget = useRef(new THREE.Vector3(0, 0, 9));
  const lookTarget = useRef(new THREE.Vector3(0, 0, -3));

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

    if (!reducedMotion) {
      const t = clock.getElapsedTime();
      posTarget.current.x += Math.sin(t * 0.15) * 0.25 + pointer.x * 0.3;
      posTarget.current.y += Math.cos(t * 0.12) * 0.15 + pointer.y * 0.15;
    }

    camera.position.lerp(posTarget.current, reducedMotion ? 1 : 0.05);
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
  const posters = mobileTier ? POSTERS.slice(0, 5) : POSTERS;

  return (
    <Canvas
      dpr={mobileTier ? [1, 1] : [1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 0, 9], fov: 50 }}
    >
      <color attach="background" args={[INK]} />
      {/* Camera sits at z=9; posters span z=-8..-0.6, so real camera-to-poster
          distance is ~9.6-17. Fog range must clear that whole span or every
          poster reads as 100% fogged (i.e. invisible, same color as bg). */}
      <fog attach="fog" args={[INK, 11, 27]} />

      <ambientLight intensity={0.85} color={INK_2} />
      <directionalLight position={[5, 8, 5]} intensity={2.4} color={RED_INK} />
      {/* Point lights use physically-based (candela-like) units in modern
          three.js -- 1.x intensities are imperceptible at scene scale. */}
      <pointLight position={[-5, -1, 2]} intensity={45} color={RED} decay={2} />

      <AtmosphereParticles
        count={mobileTier ? 20 : 50}
        color={RED}
        opacity={0.28}
        reducedMotion={reducedMotion}
      />

      {posters.map((cfg, i) => (
        <FloatingPoster
          key={i}
          config={cfg}
          reducedMotion={reducedMotion}
          mobileTier={mobileTier}
          scrollStore={scrollStore}
        />
      ))}

      <CameraRig scrollStore={scrollStore} reducedMotion={reducedMotion} />

      {!reducedMotion && !mobileTier && (
        <EffectComposer multisampling={0}>
          <DepthOfField focusDistance={0.015} focalLength={0.045} bokehScale={2.5} height={480} />
          <Bloom intensity={0.4} luminanceThreshold={0.35} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.3} darkness={0.5} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
