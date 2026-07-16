"use client";

import { useInView } from "@/lib/landing/use-in-view";

// Real, shipped lines from PROMPT_BANK (src/lib/marquee/copy.ts) -- not
// invented marketing copy.
const STATEMENTS = [
  "Pick a fucking adventure.",
  "I want something weird. Good weird.",
  "Give me something that gets good immediately.",
  "Give me something I can cry to. On purpose.",
];

export function StatementSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[140vh] flex-col items-start justify-center gap-6 px-6 py-24 sm:px-12 md:px-20"
    >
      <p className="font-mono text-xs font-semibold tracking-[0.2em] text-red uppercase">
        Say it however you actually think it
      </p>
      <div className="flex flex-col gap-5">
        {STATEMENTS.map((line, i) => (
          <p
            key={line}
            className={`font-display max-w-3xl text-3xl font-black tracking-tight text-red-ink sm:text-5xl md:text-6xl ${
              inView ? `stagger-in stagger-in-${Math.min(i + 1, 5)}` : "opacity-0"
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
