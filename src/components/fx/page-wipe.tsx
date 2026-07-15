"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Ink curtain that wipes across the screen on every route change.
 * Two panels sweep in from opposite sides, meet, then part. Sits above
 * all content while transitioning.
 */
export function PageWipe() {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} className="pointer-events-none fixed inset-0 z-[80]" aria-hidden>
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
          style={{ transformOrigin: "100% 50%" }}
          className="absolute inset-y-0 left-0 w-1/2 bg-ink"
        />
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
          style={{ transformOrigin: "0% 50%" }}
          className="absolute inset-y-0 right-0 w-1/2 bg-ink"
        />
      </motion.div>
    </AnimatePresence>
  );
}
