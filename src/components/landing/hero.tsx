"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const DustCanvas = dynamic(
  () => import("@/components/landing/dust-canvas").then((m) => m.DustCanvas),
  { ssr: false },
);

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function Hero() {
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    setWebglAvailable(detectWebGL());
  }, []);

  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden bg-black">
      {/* Background video, with a moody gradient underneath so the frame
          still reads as intentional while it loads. */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-black to-[#0a0a12]" />
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
          style={{ objectPosition: "center 25%" }}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
          <source src="/videos/hero-bg.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 to-black/50" />
      </div>

      {/* Dust particles */}
      {webglAvailable && (
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <DustCanvas />
        </div>
      )}

      {/* Letterbox bars */}
      <div className="absolute top-0 right-0 left-0 z-20 h-[9vh] bg-black pointer-events-none" />
      <div className="absolute right-0 bottom-0 left-0 z-20 h-[9vh] bg-black pointer-events-none" />

      {/* Film frame corner marks */}
      {(
        [
          "top-[9vh] left-8",
          "top-[9vh] right-8",
          "bottom-[9vh] left-8",
          "bottom-[9vh] right-8",
        ] as const
      ).map((pos, i) => (
        <div key={pos} className={`absolute z-20 h-5 w-5 pointer-events-none ${pos}`}>
          <div
            className={`absolute left-2 h-4 w-[1px] bg-white/20 ${i < 2 ? "top-0" : "bottom-0"}`}
          />
          <div
            className={`absolute left-0 h-[1px] w-4 bg-white/20 ${i < 2 ? "top-2" : "bottom-2"}`}
          />
        </div>
      ))}

      {/* Centered content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, delay: 0.3 }}
            className="font-mono text-[11px] tracking-[0.35em] text-white uppercase"
          >
            Stop Browsing, Start Watching.
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif leading-none font-light tracking-tight text-white italic"
            style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
          >
            Marquee
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="h-[1px] w-24 origin-center bg-white/30"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.2 }}
            className="text-center font-mono text-[11px] tracking-[0.35em] text-white/45"
          >
            No decision paralysis. Just press play.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.4 }}
          >
            <Link
              href="/"
              className="mt-2 cursor-pointer border border-white/20 px-8 py-3 font-mono text-[11px] tracking-[0.35em] text-white/60 uppercase transition-colors duration-500 hover:border-white/50 hover:text-white"
            >
              Enter
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Grain */}
      <div className="grain-overlay z-[15]" />
    </section>
  );
}
