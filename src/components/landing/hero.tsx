"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MaskReveal, RiseReveal } from "@/components/fx/mask-reveal";
import { ParallaxImg } from "@/components/fx/parallax-img";
import { Magnetic } from "@/components/fx/magnetic";
import { SplitWords } from "@/components/fx/split-text";

/**
 * Editorial hero — NYT front-page (70) × professional-services resume (30).
 * Big serif headline built from masked line-reveals, thin authoritative
 * rules, mono kicker/metadata, generous whitespace. Restrained, credible.
 */
export function Hero() {
  return (
    <section className="relative mx-auto max-w-5xl px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
      {/* top rule + kicker, like a section masthead */}
      <div className="edu-rule mb-3 w-full" />
      <div className="flex items-center justify-between">
        <span className="edu-kicker">DFS Performance Advisory</span>
        <span className="edu-kicker hidden sm:inline">Diagnostic Report</span>
      </div>

      {/* headline */}
      <h1 className="mt-10 font-display text-[13vw] font-bold leading-[0.98] tracking-[-0.01em] text-ink sm:mt-14 sm:text-7xl lg:text-8xl">
        <MaskReveal immediate>Stop guessing</MaskReveal>
        <MaskReveal immediate delay={0.08}>
          why you&apos;re
        </MaskReveal>
        <MaskReveal immediate delay={0.16}>
          <span className="italic">losing.</span>
        </MaskReveal>
      </h1>

      {/* lede */}
      <RiseReveal immediate delay={0.3} className="mt-8 max-w-2xl">
        <p className="font-serif text-lg leading-relaxed text-ink/80 sm:text-xl">
          <SplitWords text="Upload your DraftKings or FanDuel contest history. We audit every entry, grade your bankroll discipline, quantify exactly what your leaks cost you, and hand back a formal diagnostic with a prioritized plan. No lineups. No picks. Just the findings." />
        </p>
      </RiseReveal>

      {/* byline-style meta row */}
      <RiseReveal immediate delay={0.42}>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="edu-kicker">Analysis in ~10 seconds</span>
          <span className="edu-kicker">Your data stays private</span>
          <span className="edu-kicker">Free to run</span>
        </div>
      </RiseReveal>

      <div className="edu-hairline my-10 w-full" />

      {/* CTAs */}
      <RiseReveal immediate delay={0.5}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Magnetic>
            <Link
              href="/upload"
              className="group inline-flex items-center justify-center border-2 border-ink bg-ink px-7 py-4 font-sans text-sm font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              Upload Your History
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </Magnetic>
          <Magnetic>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center border-2 border-ink px-7 py-4 font-sans text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Read a Sample Report
            </Link>
          </Magnetic>
        </div>
      </RiseReveal>

      {/* editorial hero graphic — athlete cluster */}
      <RiseReveal immediate delay={0.6}>
        <figure className="mt-16 border-t-2 border-ink pt-8">
          <ParallaxImg
            src="/athletes-full.png"
            alt="Silhouettes of athletes across football, baseball, basketball, soccer, and tennis"
            className="mx-auto w-full max-w-3xl"
            amount={30}
          />
          <figcaption className="edu-kicker mt-4 text-center">
            Every sport. Every contest. One diagnostic.
          </figcaption>
        </figure>
      </RiseReveal>
    </section>
  );
}
