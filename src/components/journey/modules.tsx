"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const MODULES = [
  {
    id: "leaks",
    tag: "01",
    title: "Leak Detection",
    accent: "#7fe8ff",
    body: "Behavioral patterns costing you money, ranked by dollars — sport, format, buy-in, entry style. Every finding is dollar-quantified and root-caused, never vibed.",
  },
  {
    id: "coach",
    tag: "02",
    title: "AI Coach Narrative",
    accent: "#b884ff",
    body: "A blunt DFS coach reads your numbers and speaks in plain language. Nothing invented; every claim carries the entry IDs behind it.",
  },
  {
    id: "tilt",
    tag: "03",
    title: "Bankroll Radar",
    accent: "#ff8ad6",
    body: "Loss-chasing detection, peak exposure, format concentration — tilt patterns flagged before they blow your roll up.",
  },
  {
    id: "score",
    tag: "04",
    title: "Capital Discipline",
    accent: "#7fffbf",
    body: "A 0–100 grade for how well your money tracks the segments you actually beat. Movements over time, not a static number.",
  },
  {
    id: "realloc",
    tag: "05",
    title: "Reallocation Engine",
    accent: "#ffd27f",
    body: "What each losing segment cost versus redeploying that capital into your winning pocket. Concrete numbers, phased steps.",
  },
  {
    id: "gm",
    tag: "06",
    title: "Grandmaster Review",
    accent: "#c7f0ff",
    body: "A formal diagnostic — scorecard, root causes, phased roadmap. Exportable to PDF or Word to share, forward, or argue with.",
  },
];

type Mod = (typeof MODULES)[number];

export function JourneyModules() {
  const [open, setOpen] = useState<Mod | null>(null);
  return (
    <section id="modules" className="relative px-5 py-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">
            What You Get
          </div>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
            Tap any feature to explore.
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
          06
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODULES.map((m, i) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ amount: 0.3, once: true }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setOpen(m)}
            className="group relative flex min-h-[152px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur-xl"
          >
            <span
              aria-hidden
              className="absolute -inset-1 -z-10 opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${m.accent}, transparent 60%)`,
              }}
            />
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.35em]"
                style={{ color: m.accent }}
              >
                § {m.tag}
              </span>
              <motion.span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-neutral-300"
                whileHover={{ rotate: 45 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                +
              </motion.span>
            </div>
            <div>
              <h3 className="text-xl font-black leading-tight text-white">{m.title}</h3>
              <div
                className="mt-3 h-px w-8 origin-left scale-x-100 transition-transform duration-500 group-hover:scale-x-[5]"
                style={{ background: m.accent }}
              />
            </div>
          </motion.button>
        ))}
      </div>

      <ModuleModal open={open} onClose={() => setOpen(null)} modules={MODULES} />
    </section>
  );
}

function ModuleModal({
  open,
  onClose,
  modules,
}: {
  open: Mod | null;
  onClose: () => void;
  modules: Mod[];
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (open) setIdx(modules.findIndex((m) => m.id === open.id));
  }, [open, modules]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(modules.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, modules.length, onClose]);

  const current = open ? modules[idx] : null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key={current.id}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 flex max-h-[92svh] flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-white"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-0 opacity-40"
              style={{
                background: `radial-gradient(120% 50% at 50% 0%, ${current.accent}, transparent 70%)`,
              }}
            />
            <div className="relative z-10 flex items-center justify-between px-5 pt-4">
              <span className="mx-auto h-1 w-10 rounded-full bg-white/15" />
            </div>
            <div className="relative z-10 flex items-center justify-between px-5 pt-4">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.35em]"
                style={{ color: current.accent }}
              >
                § {current.tag}
              </span>
              <button
                onClick={onClose}
                aria-label="Close module"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-neutral-300 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6">
              <motion.h3
                key={current.id + "t"}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl font-black leading-[1] tracking-tight text-white"
              >
                {current.title}
              </motion.h3>
              <motion.p
                key={current.id + "b"}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="mt-5 text-[15px] leading-relaxed text-neutral-300"
              >
                {current.body}
              </motion.p>

              <div className="mt-8 grid grid-cols-3 gap-2">
                {["SIGNAL", "ROOT CAUSE", "REMEDY"].map((k, i) => (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.08 }}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-neutral-500">
                      {k}
                    </div>
                    <div className="mt-3 text-lg font-bold text-white">
                      {i === 0 ? "Detected" : i === 1 ? "Isolated" : "Phased"}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-white/10 px-5 py-4">
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-300 disabled:opacity-30"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1.5">
                {modules.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === idx ? 22 : 6,
                      background: i === idx ? current.accent : "rgba(255,255,255,0.25)",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setIdx((i) => Math.min(modules.length - 1, i + 1))}
                disabled={idx === modules.length - 1}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-300 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
