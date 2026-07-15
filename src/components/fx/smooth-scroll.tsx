"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth-scroll provider (from the motion spec — Lenis, lerp ~0.09).
 * Gives the whole app that weighted, editorial inertia-scroll feel.
 * Disables itself under prefers-reduced-motion and on touch devices where
 * native momentum scrolling is better and Lenis can feel laggy.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (reduce || isTouch) return;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
