"use client";

import { useInView } from "@/lib/landing/use-in-view";

export function StatementSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[220vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p
        className={`font-display max-w-2xl text-3xl leading-tight font-black tracking-tight text-red-ink sm:text-5xl md:text-6xl ${
          inView ? "stagger-in stagger-in-1" : "opacity-0"
        }`}
      >
        THE MOMENT
        <br />
        BEFORE THE MOVIE
      </p>
      <p
        className={`max-w-md text-base text-red-ink/70 sm:text-lg ${
          inView ? "stagger-in stagger-in-2" : "opacity-0"
        }`}
      >
        The lights disappear. The room goes quiet. Anything can happen next.
      </p>
    </section>
  );
}
