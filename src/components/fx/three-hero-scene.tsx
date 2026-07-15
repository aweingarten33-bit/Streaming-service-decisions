"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Interactive Three.js hero — a refractive glass icosahedron floating over
 * paper. Pointer drives a damped tilt (physics-based, not linear). Real-time
 * refraction via an env-map + transmission. Editorial palette: warm cream
 * environment, ink accents.
 */
export function ThreeHeroScene() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);
    scene.background = new THREE.Color("#f6f2ea");

    // Procedural cube env — warm cream + ink accents. Feeds refraction.
    const envScene = new THREE.Scene();
    const cvs = document.createElement("canvas");
    cvs.width = cvs.height = 512;
    const ctx = cvs.getContext("2d")!;
    const grd = ctx.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, "#fdf4e0");
    grd.addColorStop(0.5, "#f2ead6");
    grd.addColorStop(1, "#c9b58a");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "rgba(160,40,30,0.55)";
    ctx.beginPath();
    ctx.arc(140, 180, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(30,50,90,0.55)";
    ctx.beginPath();
    ctx.arc(380, 340, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(20,20,20,0.35)";
    ctx.beginPath();
    ctx.arc(300, 90, 60, 0, Math.PI * 2);
    ctx.fill();
    const envTex = new THREE.CanvasTexture(cvs);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    void envScene;
    scene.environment = envTex;

    // Refractive glass geometry — icosahedron, subtly detailed.
    const geo = new THREE.IcosahedronGeometry(1.55, 1);
    const mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.08,
      transmission: 1,
      thickness: 1.3,
      ior: 1.45,
      attenuationColor: new THREE.Color("#c8b48a"),
      attenuationDistance: 3.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Inner ink sphere — gives the refraction something to bend around.
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 32),
      new THREE.MeshStandardMaterial({ color: "#1a1512", metalness: 0.3, roughness: 0.35 }),
    );
    scene.add(inner);

    // Warm rim light + cool key.
    const key = new THREE.DirectionalLight("#fff2d6", 1.4);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#8aa9d6", 0.9);
    rim.position.set(-4, -2, -3);
    scene.add(rim);
    scene.add(new THREE.AmbientLight("#fff1de", 0.4));

    // Damped pointer-driven tilt (physics-based).
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0, vx: 0, vy: 0 };
    const stiffness = 0.055;
    const damping = 0.82;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      // spring toward target — anticipation + settling
      current.vx += (target.x - current.x) * stiffness;
      current.vy += (target.y - current.y) * stiffness;
      current.vx *= damping;
      current.vy *= damping;
      current.x += current.vx;
      current.y += current.vy;

      mesh.rotation.x = current.y * 0.5 + Math.sin(t * 0.4) * 0.12;
      mesh.rotation.y = current.x * 0.6 + t * 0.08;
      mesh.position.y = Math.sin(t * 0.7) * 0.08;
      inner.rotation.y = -t * 0.3;
      inner.position.x = current.x * 0.15;
      inner.position.y = -current.y * 0.15 + Math.sin(t * 0.9) * 0.05;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      geo.dispose();
      mat.dispose();
      inner.geometry.dispose();
      (inner.material as THREE.Material).dispose();
      envTex.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="absolute inset-0 h-full w-full" />;
}
