"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { SplitChars } from "@/components/fx/split-chars";

/**
 * Sticky scroll-driven storytelling. The container is 400vh tall; the inner
 * panel is pinned (sticky) while 4 stages fade/rise in and out as scroll
 * progresses. This is the "Apple product page" pattern.
 */
const STAGES = [
  {
    kicker: "Stage 01 · Ingest",
    title: "Your history becomes signal.",
    body: "Every contest, every entry, every dollar you\u2019ve ever staked \u2014 parsed, normalized, and reconciled into one auditable ledger.",
  },
  {
    kicker: "Stage 02 · Diagnose",
    title: "The leaks reveal themselves.",
    body: "We rank the behavioral patterns costing you the most money by buy-in, format, sport, and entry style. Nothing invented. Nothing hidden.",
  },
  {
    kicker: "Stage 03 · Attribute",
    title: "Variance separated from mistakes.",
    body: "We split structural losses from bad luck, then quantify what each losing segment cost versus redeploying that capital into your proven-winning pocket.",
  },
  {
    kicker: "Stage 04 · Deliver",
    title: "A grandmaster\u2019s review.",
    body: "You get a formal diagnostic \u2014 health scorecard, root causes, phased action roadmap \u2014 the kind of review chess grandmasters run after every game.",
  },
];

export function ScrollStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section ref={ref} className="relative" style={{ height: `${STAGES.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden px-5 sm:px-8">
        {/* progress rail */}
        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-4 sm:flex">
          {STAGES.map((_, i) => (
            <StageDot key={i} index={i} progress={scrollYProgress} total={STAGES.length} />
          ))}
        </div>

        <div className="relative mx-auto w-full max-w-4xl">
          {STAGES.map((s, i) => (
            <Stage key={i} index={i} total={STAGES.length} progress={scrollYProgress} data={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stage({
  index,
  total,
  progress,
  data,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  data: (typeof STAGES)[number];
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const mid = (start + end) / 2;
  const opacity = useTransform(progress, [start, mid - 0.02, mid + 0.02, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, end], ["40px", "-40px"]);
  const scale = useTransform(progress, [start, end], [0.98, 1.02]);

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="absolute inset-0 flex flex-col justify-center text-center"
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/50">
        {data.kicker}
      </div>
      <h2 className="font-display mt-6 text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-white sm:text-7xl">
        <SplitChars text={data.title} once={false} />
      </h2>
      <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-white/70 sm:text-xl">
        {data.body}
      </p>
    </motion.div>
  );
}

function StageDot({
  index,
  total,
  progress,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const scale = useTransform(progress, [start, (start + end) / 2, end], [0.6, 1.4, 0.6]);
  const opacity = useTransform(progress, [start, (start + end) / 2, end], [0.3, 1, 0.3]);
  return <motion.span style={{ scale, opacity }} className="block h-2 w-2 rounded-full bg-white" />;
}
