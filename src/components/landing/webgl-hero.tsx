"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "@/lib/landing/use-lenis";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";
import { useMobileTier } from "@/lib/landing/use-mobile-tier";
import { useWebGLSupport } from "@/lib/landing/use-webgl-support";
import { createScrollStore } from "./scroll-store";
import { LandingNav } from "./landing-nav";
import { HeroSection } from "./sections/hero-section";
import { StatementSection } from "./sections/statement-section";
import { FlashSection } from "./sections/flash-section";
import { CtaRepriseSection } from "./sections/cta-reprise-section";

const HeroScene = dynamic(() => import("./hero-scene").then((m) => m.HeroScene), {
  ssr: false,
});

// Matches CAMERA_WAYPOINTS.length in hero-scene.tsx.
const WAYPOINT_COUNT = 10;

export function WebglHero() {
  const reducedMotion = useReducedMotion();
  const mobileTier = useMobileTier();
  const webglSupported = useWebGLSupport();
  const scrollStore = useMemo(() => createScrollStore(), []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [replayKey, setReplayKey] = useState(0);

  const lenisRef = useLenis(!reducedMotion && !mobileTier);

  useEffect(() => {
    localStorage.setItem("marquee-seen-welcome", "1");
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    gsap.registerPlugin(ScrollTrigger);

    // A single scrubbed trigger spanning the whole page -- this is the one
    // deliberate, explicitly-requested exception to "no scroll-scrubbed
    // animation": it drives ONLY the 3D camera/parallax. Section text
    // reveals below stay on IntersectionObserver (see use-in-view.ts),
    // except flash-section's own scoped triggers (see that file).
    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollStore.progress = self.progress;
        scrollStore.section = self.progress * (WAYPOINT_COUNT - 1);
      },
    });

    return () => trigger.kill();
  }, [scrollStore, replayKey]);

  function handleReplay() {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: false });
    } else {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
    setReplayKey((k) => k + 1);
  }

  return (
    <div ref={wrapperRef} className="bg-ink relative">
      {/* Explicit z-0/z-10 split, not a negative z-index on the fixed layer
          -- position:fixed always opens its own stacking context, so a
          negative z-index here would be compared against unrelated
          root-level siblings instead of sinking below our own content. */}
      <div className="fixed inset-0 z-0">
        {webglSupported === false ? (
          <div className="from-ink to-ink h-full w-full bg-gradient-to-b via-[#150a08]" />
        ) : (
          <HeroScene
            key={replayKey}
            scrollStore={scrollStore}
            reducedMotion={reducedMotion}
            mobileTier={mobileTier}
          />
        )}
      </div>

      <div className="relative z-10">
        <LandingNav />
        <HeroSection />
        <StatementSection />
        <FlashSection />
        <CtaRepriseSection scrollStore={scrollStore} onReplay={handleReplay} />
      </div>
    </div>
  );
}
