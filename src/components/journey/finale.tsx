"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function JourneyFinale() {
  return (
    <section
      id="finale"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-0 -z-0"
      >
        <div className="absolute left-1/2 top-1/2 h-[80vw] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(127,232,255,0.35),transparent_60%)] blur-2xl" />
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-8 h-px w-20 origin-center bg-gradient-to-r from-transparent via-[#7fe8ff] to-transparent"
      />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="relative z-10 mb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500"
      >
        Your Move
      </motion.div>

      <h2 className="relative z-10 text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl">
        {"Your next slate".split(" ").map((w, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3 + i * 0.08 }}
            className="mr-2 inline-block"
          >
            {w}
          </motion.span>
        ))}
        <br />
        <motion.span
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-1 inline-block bg-gradient-to-r from-[#7fe8ff] via-[#b884ff] to-[#ff8ad6] bg-clip-text text-transparent"
        >
          starts here.
        </motion.span>
      </h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 1.1 }}
        className="relative z-10 mt-6 max-w-md text-base leading-relaxed text-neutral-300"
      >
        One CSV upload. A full strategy audit showing what's working, what's leaking, and what to
        change before you enter another contest.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 1.3 }}
        className="relative z-10 mt-10 flex flex-col items-center gap-4"
      >
        <Link
          href="/upload"
          className="group relative inline-flex min-h-14 items-center gap-4 overflow-hidden rounded-full bg-white px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-neutral-900"
        >
          <span className="relative z-10">Start Strategy Audit</span>
          <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-white transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_50%,rgba(127,232,255,0.6),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </Link>
        <Link
          href="/reports"
          className="font-mono text-[11px] uppercase tracking-[0.35em] text-neutral-400 underline-offset-4 hover:text-white hover:underline"
        >
          See a sample report →
        </Link>
      </motion.div>
    </section>
  );
}
