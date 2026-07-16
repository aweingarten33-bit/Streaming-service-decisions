/**
 * Plain mutable bridge between GSAP ScrollTrigger (DOM-driven) and the R3F
 * useFrame loop (render-driven). Deliberately not React state -- writing to
 * it must never trigger a re-render, since it's written on every scroll
 * tick and read on every animation frame.
 */
export interface ScrollStore {
  /** 0..1 progress across the whole scrollable page. */
  progress: number;
  /** Current section index, fractional while transitioning between two. */
  section: number;
}

export function createScrollStore(): ScrollStore {
  return { progress: 0, section: 0 };
}
