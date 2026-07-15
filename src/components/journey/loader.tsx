"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Boot loader — brand-safe, mobile-first. Fills the viewport with a
 * building-in progress ring and a subtle glyph reveal, then lifts away.
 */
export function JourneyLoader() {
  const [open, setOpen] = useState(true);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    let closeTimer = 0;
    const start = performance.now();
    const dur = 1600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // easeOutQuint
      setPct(1 - Math.pow(1 - p, 5));
      if (p < 1) raf = requestAnimationFrame(tick);
      else closeTimer = window.setTimeout(() => setOpen(false), 220);
    };
    const fallbackTimer = window.setTimeout(() => setOpen(false), dur + 700);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(closeTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#05060a]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,232,255,0.10),transparent_60%)]" />
          <div className="relative flex flex-col items-center gap-6">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              className="drop-shadow-[0_0_18px_rgba(127,232,255,0.35)]"
            >
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2"
              />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="url(#g)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#7fe8ff" />
                  <stop offset="1" stopColor="#b884ff" />
                </linearGradient>
              </defs>
              <text
                x="60"
                y="66"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="16"
                fontFamily="ui-monospace,monospace"
                letterSpacing="2"
              >
                {String(Math.round(pct * 100)).padStart(3, "0")}
              </text>
            </svg>
            <motion.div
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, letterSpacing: "0.4em" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500"
            >
              Analyzing your game
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
