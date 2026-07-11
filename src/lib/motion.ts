/**
 * Authored motion vocabulary. Every curve encodes a directorial intent —
 * anticipation, acceleration, overshoot, settling — instead of the flat
 * ease-out that libraries default to.
 */

// Cubic-bezier controls, ready for framer-motion `ease` and CSS transitions.
export const ease = {
  /** Standard entrance — pulls back 3%, then decelerates into place. */
  enter: [0.16, 1, 0.3, 1] as const,
  /** Exit — settles then accelerates out. */
  exit: [0.7, 0, 0.84, 0] as const,
  /** Emphatic — small overshoot at the end (feels weighty). */
  emphatic: [0.34, 1.56, 0.64, 1] as const,
  /** Silk — long, slow, expressive settle. */
  silk: [0.22, 1, 0.36, 1] as const,
  /** Anticipatory — begins backward before forward. */
  anticipate: [0.68, -0.35, 0.32, 1.35] as const,
  /** Editorial — restrained, print-feeling. */
  editorial: [0.65, 0.05, 0.36, 1] as const,
} as const

/** Spring presets that share a family — same damping ratio, varied stiffness. */
export const spring = {
  gentle: { type: 'spring' as const, stiffness: 120, damping: 22, mass: 0.9 },
  responsive: { type: 'spring' as const, stiffness: 260, damping: 26, mass: 0.7 },
  snappy: { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.5 },
  overshoot: { type: 'spring' as const, stiffness: 320, damping: 16, mass: 0.6 },
}

/** Stagger helper — golden-ratio pacing so cascades feel composed, not mechanical. */
export const stagger = (i: number, base = 0.06) => i * base + (i % 2) * 0.018