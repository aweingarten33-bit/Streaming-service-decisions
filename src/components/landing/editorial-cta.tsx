"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Magnetic } from "@/components/fx/magnetic";
import { SplitChars } from "@/components/fx/split-chars";
import { ease } from "@/lib/motion";

export function EditorialCTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-16 text-center sm:px-10 lg:px-16 lg:py-18">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1, ease: ease.emphatic }}
        className="mx-auto mb-8 h-px w-24 origin-left bg-[#e8e6df]"
      />
      <h2 className="font-serif text-5xl font-black leading-[0.95] tracking-[-0.02em] text-[#e8e6df] sm:text-7xl">
        <SplitChars text="Read the audit" />
        <span className="italic text-[#f5d100]">
          {" "}
          <SplitChars text="on your own play." delay={0.3} />
        </span>
      </h2>
      <p className="mx-auto mt-6 max-w-xl font-serif text-lg leading-relaxed text-[#a8a69c] sm:text-xl">
        Twenty minutes with your history file. A report you can print, forward, or argue with.
      </p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, delay: 0.3, ease: ease.emphatic }}
        className="mt-10 inline-flex flex-col items-center gap-6 sm:flex-row"
      >
        <Magnetic>
          <Link
            href="/upload"
            className="group relative inline-flex items-center overflow-hidden bg-[#e8e6df] px-10 py-5 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-[#050508]"
          >
            <span className="relative z-10">Begin the Audit</span>
            <span className="relative z-10 ml-4 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1.5">
              →
            </span>
            <span
              aria-hidden
              className="absolute inset-0 origin-left scale-x-0 bg-[#f5d100] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100"
            />
          </Link>
        </Magnetic>
      </motion.div>
    </section>
  );
}
