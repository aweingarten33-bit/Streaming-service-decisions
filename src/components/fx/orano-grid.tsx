"use client";

import { motion } from "framer-motion";

/**
 * Orano-style backdrop: near-black canvas, faint 5×N grid, and a single
 * lonely yellow bar that drifts vertically. Fixed, purely decorative.
 */
export function OranoGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050508]"
    >
      {/* vertical rules */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px)",
          backgroundSize: "20% 100%",
        }}
      />
      {/* horizontal rules */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "100% 240px",
        }}
      />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#000_100%)]" />

      {/* Lonely yellow marker */}
      <motion.div
        initial={{ y: "30vh", opacity: 0 }}
        animate={{ y: ["30vh", "55vh", "30vh"], opacity: [0, 1, 0.6, 1, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        className="absolute left-[62%] top-0 h-6 w-[3px] bg-[#f5d100]"
      />
    </div>
  );
}
