"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type CSSProperties } from "react";

/**
 * Cinematic hero — full-viewport, mobile-first. Layered parallax rings,
 * huge display headline, breathing "Explore" affordance.
 */
export function JourneyHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yNear = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  const renderWords = (text: string, delayStart: number, style?: CSSProperties) =>
    text.split(" ").map((word, i) => (
      <motion.span
        key={`${word}-${i}`}
        initial={{ opacity: 0, y: 32, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.85, delay: delayStart + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={style}
        className="mr-[0.22em] inline-block whitespace-nowrap"
      >
        {word}{" "}
      </motion.span>
    ));

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-20 pt-10 sm:pb-24 sm:pt-20"
    >
      {/* hero video anchored to the Signal headline area */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute left-1/2 top-[40%] h-[78svh] min-h-[560px] w-full -translate-x-1/2 -translate-y-1/2 object-cover sm:top-[40%] sm:h-[85svh]"
        >
          <source src="/videos/hero.webm" type="video/webm" />
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#05060a]" />
      </div>

      {/* top meta */}
      <motion.div
        style={{ opacity }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500"
      >
        <span></span>
      </motion.div>

      {/* headline */}
      <motion.div style={{ y: yNear }} className="relative z-10 mt-auto">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="relative z-10 mb-4 h-px w-16 origin-left bg-gradient-to-r from-[#7fe8ff] to-transparent sm:mb-6"
        />
        <h1 className="relative z-10 max-w-[11ch] text-[clamp(3.2rem,17vw,5rem)] font-light leading-[0.92] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.9)] sm:max-w-[12ch] sm:text-[86px] md:text-[112px]">
          {renderWords("Play DFS like a", 0.65)}
          {renderWords("chess player.", 1.15, {
            backgroundImage: "linear-gradient(90deg, #7fe8ff, #b884ff, #ff8ad6)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          })}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mt-5 max-w-[42ch] text-sm leading-relaxed text-neutral-300 drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)] sm:text-base"
        >
          In chess, every move shapes the position that follows. The same is true in DFS.
        </motion.p>
      </motion.div>
    </section>
  );
}
