"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Paper-stock editorial backdrop. Warm cream wash, drifting ink halos,
 * fine engraved grid, and a printed-page vignette. Ambient micro-motion
 * lives here — nothing static, nothing loud.
 */
export function EditorialBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-[#f6f2ea]"
    >
      {/* warm wash — the "paper" */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,246,230,0.9),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(233,224,208,0.6),transparent_55%)]" />

      {/* two slow ink halos — very restrained hue */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -left-32 top-[8%] h-[55vh] w-[55vh] rounded-full opacity-[0.18] blur-[100px]"
        animate={{
          background: [
            "radial-gradient(circle, rgba(180,50,40,0.9), transparent 60%)",
            "radial-gradient(circle, rgba(120,90,50,0.9), transparent 60%)",
            "radial-gradient(circle, rgba(180,50,40,0.9), transparent 60%)",
          ],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute -right-32 top-[55%] h-[60vh] w-[60vh] rounded-full opacity-[0.15] blur-[120px]"
        animate={{
          background: [
            "radial-gradient(circle, rgba(30,60,110,0.9), transparent 60%)",
            "radial-gradient(circle, rgba(60,90,60,0.9), transparent 60%)",
            "radial-gradient(circle, rgba(30,60,110,0.9), transparent 60%)",
          ],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* fine engraved grid — like a newspaper column ruler */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.9) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }}
      />

      {/* printed-page vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(60,40,20,0.20)_100%)]" />
    </div>
  );
}
