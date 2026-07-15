"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const STOPS = [
  { id: "hero", label: "Top" },
  { id: "journey", label: "How It Works" },
  { id: "finale", label: "Start Audit" },
];

/**
 * Sticky mobile chapter nav. Bottom-anchored, glass, with an animated
 * progress rail and current chapter dot. Tap to jump.
 */
export function JourneyNav() {
  const [active, setActive] = useState("hero");
  const [pct, setPct] = useState(0);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setPct(v);
    // pick nearest section by DOM position
    let current = STOPS[0].id;
    for (const s of STOPS) {
      const el = document.getElementById(s.id);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight * 0.4) current = s.id;
      }
    }
    setActive(current);
  });

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2 backdrop-blur-xl">
        {STOPS.map((s) => {
          const on = s.id === active;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`relative flex-1 rounded-full px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] transition-colors ${
                on ? "text-neutral-900" : "text-neutral-300 hover:text-white"
              }`}
            >
              {on && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full bg-white"
                />
              )}
              {s.label}
            </a>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-6 bottom-[-6px] h-px overflow-hidden rounded-full bg-white/10">
        <div
          style={{ width: `${pct * 100}%` }}
          className="h-full bg-gradient-to-r from-[#7fe8ff] via-[#b884ff] to-[#ff8ad6] transition-[width] duration-150"
        />
      </div>
    </motion.nav>
  );
}
