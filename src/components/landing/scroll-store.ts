/**
 * Plain mutable bridge between GSAP ScrollTrigger (DOM-driven) and the R3F
 * useFrame loop (render-driven). Deliberately not React state -- writing to
 * it must never trigger a re-render, since it's written on every scroll
 * tick and read on every animation frame.
 */
export interface ScrollStore {
  /** 0..1 progress across the whole scrollable page. */
  progress: number;
  /** Fractional camera-waypoint index, derived from progress. */
  section: number;
}

export function createScrollStore(): ScrollStore {
  return { progress: 0, section: 0 };
}

/**
 * Named sub-ranges of the single global `progress` value -- each chapter
 * reads only its own range via `remap(progress, ...RANGES.x)`. Kept as data
 * here (not logic) so every chapter agrees on where one beat ends and the
 * next begins.
 */
export const RANGES = {
  darkness: [0.0, 0.15],
  lensPush: [0.15, 0.3],
  popcorn: [0.3, 0.55],
  stretch: [0.55, 0.62],
  flash: [0.62, 0.68],
  eras: [0.68, 0.92],
  finale: [0.92, 1.0],
} as const satisfies Record<string, [number, number]>;
