"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/landing/use-in-view";
import type { ScrollStore } from "../scroll-store";

export function CtaRepriseSection({
  scrollStore,
  onReplay,
}: {
  scrollStore: ScrollStore;
  onReplay: () => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div ref={ref} className={inView ? "envelope-reveal" : "opacity-0"}>
        <h2 className="font-display max-w-xl text-3xl leading-tight font-black tracking-tight text-red-ink sm:text-5xl">
          YOU DON&apos;T NEED MORE OPTIONS.
          <br />
          YOU NEED THE RIGHT MOVIE.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-red-ink/70 sm:text-lg">
          Tell us what kind of night you want. We&apos;ll take you somewhere worth watching.
        </p>
        <div className="stencil-rule mx-auto mt-6 w-16" />

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            asChild
            size="lg"
            className="btn-press h-12 px-8 text-base"
            onMouseEnter={() => {
              scrollStore.hoverBoost = 1;
            }}
            onMouseLeave={() => {
              scrollStore.hoverBoost = 0;
            }}
          >
            <Link href="/">FIND SOMETHING TO WATCH</Link>
          </Button>
          <button
            type="button"
            onClick={onReplay}
            className="font-mono text-xs font-semibold tracking-[0.15em] text-red-ink/60 uppercase underline-offset-4 hover:text-red-ink hover:underline"
          >
            Take the journey again
          </button>
        </div>
      </div>
    </section>
  );
}
