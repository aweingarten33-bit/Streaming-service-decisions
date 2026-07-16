"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "@/lib/landing/use-lenis";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";
import { useMobileTier } from "@/lib/landing/use-mobile-tier";
import { createScrollStore } from "./scroll-store";
import { LandingNav } from "./landing-nav";
import { HeroSection } from "./sections/hero-section";
import { StatementSection } from "./sections/statement-section";
import { CtaRepriseSection } from "./sections/cta-reprise-section";

const HeroScene = dynamic(() => import("./hero-scene").then((m) => m.HeroScene), {
  ssr: false,
});

// Matches the length of CAMERA_WAYPOINTS in hero-scene.tsx -- one waypoint
// per section below (hero / statement / cta-reprise).
const SECTION_COUNT = 3;

export function WebglHero() {
  const reducedMotion = useReducedMotion();
  const mobileTier = useMobileTier();
  const scrollStore = useMemo(() => createScrollStore(), []);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLenis(!reducedMotion && !mobileTier);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    gsap.registerPlugin(ScrollTrigger);

    // A single scrubbed trigger spanning the whole page -- this is the one
    // deliberate, explicitly-requested exception to "no scroll-scrubbed
    // animation": it drives ONLY the 3D camera/parallax. Section text
    // reveals below stay on IntersectionObserver (see use-in-view.ts).
    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollStore.progress = self.progress;
        scrollStore.section = self.progress * (SECTION_COUNT - 1);
      },
    });

    return () => trigger.kill();
  }, [scrollStore]);

  return (
    <div ref={wrapperRef} className="bg-ink relative">
      {/* Explicit z-0/z-10 split, not a negative z-index on the fixed layer
          -- position:fixed always opens its own stacking context, so a
          negative z-index here would be compared against unrelated
          root-level siblings instead of sinking below our own content. */}
      <div className="fixed inset-0 z-0">
        <HeroScene
          scrollStore={scrollStore}
          reducedMotion={reducedMotion}
          mobileTier={mobileTier}
        />
      </div>

      <div className="relative z-10">
        <LandingNav />
        <HeroSection />
        <StatementSection />
        <CtaRepriseSection />
      </div>
    </div>
  );
}
