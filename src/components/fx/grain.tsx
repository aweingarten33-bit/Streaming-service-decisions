"use client";

/**
 * Filmic grain overlay — fixed full-viewport SVG turbulence tile,
 * screen blended, extremely low opacity. Adds analog texture without
 * killing performance (single element, no animation on mobile). Screen
 * (not multiply) because the app's background is jet black -- multiply
 * only darkens, which is invisible against near-black.
 */
export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.10] mix-blend-screen"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundSize: "240px 240px",
      }}
    />
  );
}
