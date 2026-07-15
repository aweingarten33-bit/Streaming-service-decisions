"use client";

import { motion } from "framer-motion";

/**
 * Minimalist dark backdrop — deep near-black with two whisper-soft
 * neon radials drifting. No particles, no grid. Lets the video breathe.
 */
export function JourneyBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05060a]"
    >
      <motion.div
        className="absolute left-[-15%] top-[15%] h-[70vw] w-[70vw] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(127,232,255,0.10),transparent 60%)" }}
        animate={{ x: [0, 30, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-20%] bottom-[10%] h-[80vw] w-[80vw] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(184,132,255,0.10),transparent 60%)" }}
        animate={{ x: [0, -24, 0], y: [0, 18, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
