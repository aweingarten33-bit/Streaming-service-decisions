"use client";

import { createElement, useEffect, useRef, useState, type ElementType } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*";

/**
 * Orano-style scramble reveal — target chars are replaced by rolling
 * random glyphs that settle into place, letter by letter. Runs once on
 * mount unless `loop` is set. Preserves layout with a monospace font.
 */
export function TextScramble({
  text,
  duration = 1400,
  delay = 0,
  className = "",
  as = "span",
}: {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const [out, setOut] = useState(text.replace(/[^ ]/g, "\u00A0"));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now() + delay;
    const chars = text.split("");
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / duration));
      const settled = Math.floor(p * chars.length);
      const next = chars
        .map((c, i) => {
          if (c === " ") return " ";
          if (i < settled) return c;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      setOut(next);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [text, duration, delay]);

  return createElement(as, { className }, out);
}
