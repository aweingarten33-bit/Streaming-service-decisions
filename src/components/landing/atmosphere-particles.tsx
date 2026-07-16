"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A soft, restrained dust field -- the app's existing `.spotlight-glow`
 * overspray motif (scattered, red-tinted, low-opacity dots) translated into
 * 3D, not a generic sci-fi star field. Normal alpha blending, not additive
 * -- additive glow is what reads as "generic AI landing page."
 */
const VERTEX_SHADER = `
  uniform float uTime;
  attribute float aPhase;
  attribute float aSize;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 0.15 + aPhase) * 0.4;
    pos.x += cos(uTime * 0.1 + aPhase * 1.3) * 0.25;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, alpha * uOpacity);
  }
`;

export function AtmosphereParticles({
  count = 60,
  color = "#d81e2c",
  opacity = 0.3,
  bounds = [16, 9, 12],
  reducedMotion = false,
}: {
  count?: number;
  color?: string;
  opacity?: number;
  bounds?: [number, number, number];
  reducedMotion?: boolean;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, phases, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const [bx, by, bz] = bounds;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * bx;
      positions[i * 3 + 1] = (Math.random() - 0.5) * by;
      positions[i * 3 + 2] = (Math.random() - 0.5) * bz - 3;
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 0.6 + Math.random() * 1.4;
    }
    return { positions, phases, sizes };
  }, [count, bounds]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    }),
    [color, opacity],
  );

  useFrame(({ clock }) => {
    if (reducedMotion || !materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
