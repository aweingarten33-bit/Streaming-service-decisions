"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SplitChars } from "@/components/fx/split-chars";
import { Magnetic } from "@/components/fx/magnetic";

/**
 * Cinematic hero — 10+ depth layers, drifting parallax, char-by-char
 * headline, magnetic CTAs. Dark backdrop lives at the landing scope level.
 */
export function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const yBack = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const yMid = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const yFront = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-24 sm:px-8"
    >
      {/* depth layer 1 — far chrome ring */}
      <motion.div
        style={{ y: yBack, scale }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[120vh] w-[120vh] rounded-full border border-white/10" />
        <div className="absolute h-[90vh] w-[90vh] rounded-full border border-white/10" />
        <div className="absolute h-[60vh] w-[60vh] rounded-full border border-white/10" />
      </motion.div>

      {/* depth layer 2 — mid ticker numbers */}
      <motion.div style={{ y: yMid }} className="pointer-events-none absolute inset-0 opacity-25">
        {[
          { t: "+128.4%", l: "8%", p: "18%" },
          { t: "-42.1%", l: "84%", p: "22%" },
          { t: "ROI", l: "12%", p: "78%" },
          { t: "EV +$412", l: "78%", p: "72%" },
          { t: "ENTRIES 3,204", l: "46%", p: "12%" },
          { t: "TILT 0.24", l: "52%", p: "88%" },
        ].map((n) => (
          <span
            key={n.t}
            className="absolute font-mono text-xs uppercase tracking-[0.3em] text-white/70"
            style={{ left: n.l, top: n.p }}
          >
            {n.t}
          </span>
        ))}
      </motion.div>

      {/* depth layer 3 — front content */}
      <motion.div
        style={{ y: yFront, opacity }}
        className="relative z-10 mx-auto max-w-6xl text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-white/60">
          <span className="h-px w-10 bg-white/40" />
          <span>DFS Decision Intelligence</span>
          <span className="h-px w-10 bg-white/40" />
        </div>

        <h1 className="font-display text-[14vw] font-bold leading-[0.92] tracking-[-0.02em] text-white sm:text-[9rem]">
          <div>
            <SplitChars text="Stop guessing" />
          </div>
          <div className="mt-2 bg-gradient-to-r from-[#7f7fff] via-[#e0a8ff] to-[#ffb37f] bg-clip-text text-transparent">
            <SplitChars text="why you lose." delay={0.35} />
          </div>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-10 max-w-2xl font-serif text-lg leading-relaxed text-white/70 sm:text-xl"
        >
          Upload your DraftKings or FanDuel history. We audit every entry, quantify what your leaks
          cost, and hand back a decision-intelligence report. No lineups. Just the findings.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Magnetic>
            <Link
              href="/upload"
              className="group relative inline-flex items-center justify-center overflow-hidden border border-white/20 bg-white px-9 py-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-black transition-colors"
            >
              <span className="relative z-10">Upload Your History</span>
              <span className="relative z-10 ml-3 transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Magnetic>
          <Magnetic>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center border border-white/30 bg-white/5 px-9 py-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-colors hover:bg-white/10"
            >
              See a Sample Report
            </Link>
          </Magnetic>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="mt-20 font-mono text-[10px] uppercase tracking-[0.4em] text-white/50"
        >
          Scroll ↓
        </motion.div>
      </motion.div>
    </section>
  );
}
