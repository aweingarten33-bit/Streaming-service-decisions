"use client";

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * GPU particle field that morphs between three shapes on scroll — dollar
 * sign, bar chart, sphere. Positions live in a Float32Array uploaded once;
 * a custom shader interpolates between the two nearest targets, driven by
 * a `uMorph` uniform that we set from an IntersectionObserver + scroll.
 */

const COUNT = 12000

function shape(target: Float32Array, kind: 'sphere' | 'bars' | 'grid') {
  for (let i = 0; i < COUNT; i++) {
    const o = i * 3
    if (kind === 'sphere') {
      // Fibonacci sphere for even coverage
      const y = 1 - (i / (COUNT - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = i * 2.399963229
      target[o] = Math.cos(th) * r * 1.9
      target[o + 1] = y * 1.9
      target[o + 2] = Math.sin(th) * r * 1.9
    } else if (kind === 'bars') {
      const bars = 24
      const b = i % bars
      const rowsPerBar = Math.floor(COUNT / bars)
      const row = Math.floor(i / bars)
      const barHeight = 0.4 + Math.abs(Math.sin(b * 0.7 + 1.2)) * 2.2
      const t = row / rowsPerBar
      target[o] = (b / (bars - 1) - 0.5) * 4.2
      target[o + 1] = t * barHeight - 1.6
      target[o + 2] = (Math.random() - 0.5) * 0.15
    } else {
      // grid — engraved data plane
      const side = Math.ceil(Math.sqrt(COUNT))
      const gx = i % side
      const gy = Math.floor(i / side)
      target[o] = (gx / (side - 1) - 0.5) * 4
      target[o + 1] = (gy / (side - 1) - 0.5) * 2.6
      target[o + 2] = Math.sin(gx * 0.4) * Math.cos(gy * 0.4) * 0.4
    }
  }
}

export function ParticleMorph() {
  const mount = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mount.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0, 0, 6.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const posA = new Float32Array(COUNT * 3)
    const posB = new Float32Array(COUNT * 3)
    const posC = new Float32Array(COUNT * 3)
    shape(posA, 'sphere')
    shape(posB, 'bars')
    shape(posC, 'grid')

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('aPosA', new THREE.BufferAttribute(posA, 3))
    geo.setAttribute('aPosB', new THREE.BufferAttribute(posB, 3))
    geo.setAttribute('aPosC', new THREE.BufferAttribute(posC, 3))
    const seed = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) seed[i] = Math.random()
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))

    const uniforms = {
      uMorph: { value: 0 }, // 0..2  (A→B→C)
      uT: { value: 0 },
      uInk: { value: new THREE.Color('#171412') },
      uAccent: { value: new THREE.Color('#a83428') },
    }

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute vec3 aPosA;
        attribute vec3 aPosB;
        attribute vec3 aPosC;
        attribute float aSeed;
        uniform float uMorph;
        uniform float uT;
        varying float vSeed;
        varying float vMix;
        // authored ease — cubic in-out with tiny overshoot
        float ease(float x){ return x<0.5 ? 4.0*x*x*x : 1.0 - pow(-2.0*x + 2.0, 3.0)/2.0; }
        void main(){
          float m = clamp(uMorph, 0.0, 2.0);
          vec3 p;
          if (m < 1.0) {
            float k = ease(m);
            p = mix(aPosA, aPosB, k);
          } else {
            float k = ease(m - 1.0);
            p = mix(aPosB, aPosC, k);
          }
          // ambient micro-motion, per-particle
          float w = aSeed * 6.2831;
          p += 0.035 * vec3(sin(uT*0.9 + w), cos(uT*1.1 + w*1.3), sin(uT*0.7 + w*0.7));
          vSeed = aSeed;
          vMix = m;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + aSeed * 2.5) * (300.0 / -mv.z);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec3 uInk;
        uniform vec3 uAccent;
        varying float vSeed;
        varying float vMix;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d) * 0.9;
          vec3 col = mix(uInk, uAccent, step(0.85, vSeed) * 0.9);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // Damped morph target driven by scroll progress through the section.
    let target = 0
    let current = 0
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const raw = (vh - r.top) / (vh + r.height)
      target = Math.max(0, Math.min(2, raw * 2))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    let raf = 0
    const t0 = performance.now()
    const loop = () => {
      current += (target - current) * 0.06
      uniforms.uMorph.value = current
      uniforms.uT.value = (performance.now() - t0) / 1000
      points.rotation.y += 0.0015
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mount} className="absolute inset-0 h-full w-full" />
}