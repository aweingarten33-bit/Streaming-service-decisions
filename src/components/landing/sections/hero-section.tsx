"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-ink/20" />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="animate-in fade-in slide-in-from-bottom-4 font-display max-w-3xl text-4xl font-black tracking-tight text-red-ink duration-700 sm:text-6xl md:text-7xl">
          Stop scrolling. Start watching.
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-4 mt-5 max-w-xl text-base text-red-ink/70 duration-700 delay-150 sm:text-lg">
          Personalized movie and TV recommendations pulled from trusted voices across the internet.
        </p>
        <Button
          asChild
          size="lg"
          className="animate-in fade-in slide-in-from-bottom-4 pointer-events-auto mt-8 h-12 px-8 text-base delay-300 duration-700"
        >
          <Link href="/">Find Something to Watch</Link>
        </Button>
      </div>
    </section>
  );
}
