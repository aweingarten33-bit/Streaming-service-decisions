"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { remap } from "@/lib/landing/scroll-range";
import { RANGES, type ScrollStore } from "../scroll-store";
import { AtmosphereParticles } from "../atmosphere-particles";

const BUTTER = "#e8a13c";
const SALT = "#f5f0e6";

interface KernelInstance {
  base: THREE.Vector3;
  scale: number;
  rotation: THREE.Euler;
  phase: number;
}

function useKernelInstances(count: number) {
  return useMemo<KernelInstance[]>(() => {
    const instances: KernelInstance[] = [];
    for (let i = 0; i < count; i++) {
      instances.push({
        base: new THREE.Vector3(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 6,
          -Math.random() * 14,
        ),
        scale: 0.35 + Math.random() * 0.5,
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ),
        phase: Math.random() * Math.PI * 2,
      });
    }
    return instances;
  }, [count]);
}

function KernelSwarm({
  geometries,
  instances,
  scrollStore,
  reducedMotion,
}: {
  geometries: { geometry: THREE.BufferGeometry; material: THREE.Material }[];
  instances: KernelInstance[];
  scrollStore: ScrollStore;
  reducedMotion: boolean;
}) {
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointerWorld = useRef(new THREE.Vector3());
  const { camera } = useThree();

  useFrame(({ pointer, clock }) => {
    const popcornProgress = remap(scrollStore.progress, ...RANGES.popcorn);
    if (popcornProgress <= 0 && scrollStore.progress < RANGES.popcorn[0]) {
      // still fully hidden before this chapter -- skip the per-instance work
      return;
    }
    const t = reducedMotion ? 0 : clock.getElapsedTime();

    pointerWorld.current.set(pointer.x, pointer.y, 0.5).unproject(camera);

    const driftAngle = scrollStore.progress * Math.PI * 1.4;
    const driftX = Math.cos(driftAngle) * 0.4;
    const driftY = Math.sin(driftAngle * 0.7) * 0.25;

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const bob = reducedMotion ? 0 : Math.sin(t * 0.6 + inst.phase) * 0.12;

      dummy.position.set(
        inst.base.x + (reducedMotion ? 0 : driftX * (1 + inst.phase * 0.05)),
        inst.base.y + bob + (reducedMotion ? 0 : driftY),
        inst.base.z + popcornProgress * 2.5,
      );

      if (!reducedMotion) {
        const toPointer = dummy.position.distanceTo(pointerWorld.current);
        if (toPointer < 3.5) {
          const push = (1 - toPointer / 3.5) * 0.6;
          const dir = dummy.position.clone().sub(pointerWorld.current).normalize();
          dummy.position.addScaledVector(dir, push);
        }
        dummy.rotation.set(inst.rotation.x + t * 0.15, inst.rotation.y + t * 0.12, inst.rotation.z);
      } else {
        dummy.rotation.copy(inst.rotation);
      }

      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();

      for (const meshRef of meshRefs.current) {
        meshRef?.setMatrixAt(i, dummy.matrix);
      }
    }

    for (const meshRef of meshRefs.current) {
      if (meshRef) meshRef.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {geometries.map((g, gi) => (
        <instancedMesh
          key={gi}
          ref={(el) => {
            meshRefs.current[gi] = el;
          }}
          args={[g.geometry, g.material, instances.length]}
        />
      ))}
    </>
  );
}

/** A handful of kernels rendered individually (not instanced) so they can "burst" -- a quick pop in scale/rotation rather than a true vertex-fracture shader, kept simple and cheap. */
function BurstingKernels({
  templateScene,
  scrollStore,
  reducedMotion,
}: {
  templateScene: THREE.Group;
  scrollStore: ScrollStore;
  reducedMotion: boolean;
}) {
  const positions = useMemo(
    () => [
      new THREE.Vector3(-1.8, 0.6, -3),
      new THREE.Vector3(2.1, -0.4, -5),
      new THREE.Vector3(0.4, 1.3, -6.5),
      new THREE.Vector3(-2.6, -1.1, -8),
    ],
    [],
  );
  const triggerAt = useMemo(() => positions.map((_, i) => 0.35 + i * 0.08), [positions]);
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    positions.forEach((_, i) => {
      const group = refs.current[i];
      if (!group) return;
      const localProgress = remap(scrollStore.progress, triggerAt[i], triggerAt[i] + 0.06);
      const pop = 1 + Math.sin(Math.min(localProgress, 1) * Math.PI) * 0.35;
      group.scale.setScalar(pop);
      group.rotation.y = t * 0.4 + i;
      group.rotation.x = Math.sin(t * 0.3 + i) * 0.3;
    });
  });

  return (
    <>
      {positions.map((pos, i) => (
        <group
          key={i}
          position={pos}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <primitive object={templateScene.clone(true)} scale={0.75} />
        </group>
      ))}
    </>
  );
}

function ButterDroplets({
  scrollStore,
  reducedMotion,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
}) {
  const positions = useMemo(
    () =>
      Array.from({ length: 10 }, () => ({
        base: new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 5,
          -Math.random() * 12,
        ),
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const p = positions[i];
      child.position.set(p.base.x, p.base.y + Math.sin(t * 0.4 + p.phase) * 0.3, p.base.z);
    });
  });

  return (
    <group ref={groupRef}>
      {positions.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial
            color={BUTTER}
            emissive={BUTTER}
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function PopcornField({
  scrollStore,
  reducedMotion,
  mobileTier,
}: {
  scrollStore: ScrollStore;
  reducedMotion: boolean;
  mobileTier: boolean;
}) {
  const kernelGltf = useGLTF("/models/popcorn-kernel.glb");
  const cupGltf = useGLTF("/models/popcorn-cup.glb");

  const kernelGeometries = useMemo(() => {
    const found: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];
    kernelGltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        found.push({ geometry: mesh.geometry, material: mesh.material as THREE.Material });
      }
    });
    return found;
  }, [kernelGltf]);

  const clonedCup = useMemo(() => cupGltf.scene.clone(true), [cupGltf]);

  const count = mobileTier ? 60 : 220;
  const instances = useKernelInstances(count);

  return (
    <group>
      <primitive
        object={clonedCup}
        position={[3, -3, -10]}
        scale={2.4}
        rotation={[0, -0.6, 0.05]}
      />

      {kernelGeometries.length > 0 && (
        <KernelSwarm
          geometries={kernelGeometries}
          instances={instances}
          scrollStore={scrollStore}
          reducedMotion={reducedMotion}
        />
      )}

      {!mobileTier && (
        <BurstingKernels
          templateScene={kernelGltf.scene}
          scrollStore={scrollStore}
          reducedMotion={reducedMotion}
        />
      )}

      <ButterDroplets scrollStore={scrollStore} reducedMotion={reducedMotion} />

      <AtmosphereParticles
        count={mobileTier ? 15 : 40}
        color={SALT}
        opacity={0.4}
        bounds={[10, 6, 16]}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}

useGLTF.preload("/models/popcorn-kernel.glb");
useGLTF.preload("/models/popcorn-cup.glb");
