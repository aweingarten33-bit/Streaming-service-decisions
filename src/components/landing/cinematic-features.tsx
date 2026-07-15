"use client";

import { motion } from "framer-motion";
import { SplitChars } from "@/components/fx/split-chars";
import { TiltCard } from "@/components/fx/tilt";

const FEATURES = [
  {
    tag: "01",
    title: "Leak Detection",
    body: "Every behavioral pattern costing you money — ranked by buy-in, format, sport, and entry style.",
  },
  {
    tag: "02",
    title: "AI Coach Narrative",
    body: "A blunt DFS coach reads your numbers and tells you where your edge leaks. Never invents stats.",
  },
  {
    tag: "03",
    title: "Bankroll Risk Radar",
    body: "Loss-chasing detection, peak exposure, format concentration. Tilt patterns flagged before they blow up.",
  },
  {
    tag: "04",
    title: "Capital Discipline Score",
    body: "A 0–100 grade for how well your money tracks the segments you can actually beat.",
  },
  {
    tag: "05",
    title: "Reallocation Engine",
    body: "What each losing segment cost you versus redeploying that capital into your winning pocket.",
  },
  {
    tag: "06",
    title: "Grandmaster Review",
    body: "A formal diagnostic — health scorecard, root causes, phased roadmap. Exportable PDF or Word.",
  },
];

export function CinematicFeatures() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-32 sm:px-8">
      <div className="mb-16 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/50">
          The Toolkit
        </div>
        <h2 className="font-display mt-4 text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-white sm:text-7xl">
          <SplitChars text="Six lenses on your play." />
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.tag}
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.9, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltCard className="group relative overflow-hidden border border-white/15 bg-white/[0.04] p-8 backdrop-blur-xl">
              {/* breathing gradient */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 20%, rgba(127,127,255,0.35), transparent 60%)",
                    "radial-gradient(circle at 80% 80%, rgba(255,127,180,0.35), transparent 60%)",
                    "radial-gradient(circle at 20% 20%, rgba(127,127,255,0.35), transparent 60%)",
                  ],
                }}
                transition={{ duration: 10 + i, repeat: Infinity, ease: "linear" }}
              />
              {/* moving reflection */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ["0%", "400%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
              />
              <div className="relative">
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
                  {f.tag}
                </div>
                <h3 className="font-display mt-3 text-2xl font-bold leading-tight text-white">
                  {f.title}
                </h3>
                <p className="mt-3 font-serif text-base leading-relaxed text-white/70">{f.body}</p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
