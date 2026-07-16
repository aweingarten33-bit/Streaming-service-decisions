"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * "The text should appear briefly within the changing environment, then
 * disappear as the tracks dissolve into abstract light" -- this needs to
 * reverse, not just fire once, so it gets its own scoped ScrollTrigger
 * (two of them: one driving the fade-in, one the fade-out) rather than the
 * reveal-once IntersectionObserver pattern the other sections use.
 */
export function FlashSection() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "top 25%",
            scrub: true,
          },
        },
      );
      gsap.to(textRef.current, {
        opacity: 0,
        y: -16,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "center 35%",
          end: "bottom top",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[160vh] flex-col items-center justify-center px-6 text-center"
    >
      <div ref={textRef} className="flex flex-col items-center gap-4 opacity-0">
        <h2 className="font-display text-3xl font-black tracking-tight text-red-ink sm:text-5xl">
          WHERE ARE WE GOING?
        </h2>
        <p className="text-base text-red-ink/70 sm:text-lg">Anywhere worth watching.</p>
      </div>
    </section>
  );
}
