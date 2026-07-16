"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, RoundedBox } from "@react-three/drei";
import type { ScrollStore } from "./scroll-store";

export interface PosterConfig {
  position: [number, number, number];
  size: [number, number];
  /** Only a couple of cards should carry the one red accent -- never bichromatic. */
  accent: boolean;
  floatSpeed: number;
  floatIntensity: number;
  rotationIntensity: number;
  /** How strongly this card drifts as the page scrolls -- closer cards (bigger value) move more, reading as depth. */
  parallax: number;
}

/** Stylized poster silhouette -- no real artwork, so no licensing surface and nothing that fights the app's single-accent rule. */
function makeCardTexture(accent: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1a1712");
  gradient.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const vignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.15,
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.78,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (accent) {
    // the one hit of red -- a soft bloom from above, echoing .spotlight-glow
    const glow = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height * 0.28,
      0,
      canvas.width / 2,
      canvas.height * 0.28,
      canvas.height * 0.45,
    );
    glow.addColorStop(0, "rgba(216,30,44,0.35)");
    glow.addColorStop(1, "rgba(216,30,44,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(216,30,44,0.7)";
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // .stencil-rule echo -- a dashed perforation, this app's own "commitment" motif
    ctx.strokeStyle = "rgba(216,30,44,0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 40);
    ctx.lineTo(canvas.width - 20, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = "rgba(245,240,230,0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function FloatingPoster({
  config,
  reducedMotion,
  mobileTier,
  scrollStore,
}: {
  config: PosterConfig;
  reducedMotion: boolean;
  mobileTier: boolean;
  scrollStore: ScrollStore;
}) {
  const texture = useMemo(() => makeCardTexture(config.accent), [config.accent]);
  const groupRef = useRef<THREE.Group>(null);
  const hoverRef = useRef(0);
  const [width, height] = config.size;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const offset = scrollStore.progress * config.parallax * 2.5;
    group.position.y = config.position[1] + offset;

    if (!mobileTier) {
      const targetHover = group.userData.hovered ? 1 : 0;
      hoverRef.current = THREE.MathUtils.damp(hoverRef.current, targetHover, 6, delta);
      group.scale.setScalar(1 + hoverRef.current * 0.06);
      group.rotation.y = hoverRef.current * 0.12;
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : config.floatSpeed}
      floatIntensity={reducedMotion ? 0 : config.floatIntensity}
      rotationIntensity={reducedMotion ? 0 : config.rotationIntensity}
      floatingRange={reducedMotion ? [0, 0] : [-0.15, 0.15]}
    >
      <group
        ref={groupRef}
        position={config.position}
        onPointerOver={(e) => {
          if (mobileTier || !groupRef.current) return;
          e.stopPropagation();
          groupRef.current.userData.hovered = true;
        }}
        onPointerOut={(e) => {
          if (mobileTier || !groupRef.current) return;
          e.stopPropagation();
          groupRef.current.userData.hovered = false;
        }}
      >
        <RoundedBox args={[width, height, 0.08]} radius={0.05} smoothness={4}>
          <meshStandardMaterial map={texture} roughness={0.65} metalness={0.05} />
        </RoundedBox>
      </group>
    </Float>
  );
}
