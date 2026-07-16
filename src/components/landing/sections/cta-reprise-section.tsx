"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/landing/use-in-view";
// Real, shipped headline (src/lib/marquee/copy.ts) -- the exact line every
// user sees the moment they land inside the app itself.
import { HEADLINE } from "@/lib/marquee/copy";

export function CtaRepriseSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <section
      ref={ref}
      className="spotlight-glow relative flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
    >
      <div className={inView ? "envelope-reveal" : "opacity-0"}>
        <h2 className="font-display max-w-2xl text-3xl font-black tracking-tight text-red-ink sm:text-5xl">
          {HEADLINE}
        </h2>
        <div className="stencil-rule mx-auto mt-6 w-16" />
        <Button asChild size="lg" className="btn-press mt-8 h-12 px-8 text-base">
          <Link href="/">Find Something to Watch</Link>
        </Button>
      </div>
    </section>
  );
}
