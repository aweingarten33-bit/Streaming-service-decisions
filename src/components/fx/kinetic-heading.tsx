"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Kinetic heading — scales + drifts on scroll as it passes through the
 * viewport. Gives huge display type that "breathes" with the page.
 */
export function KineticHeading({
  children,
  className,
  from = 0.9,
  to = 1.06,
}: {
  children: ReactNode;
  className?: string;
  from?: number;
  to?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [from, to, from]);
  const y = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const letterSpacing = useTransform(scrollYProgress, [0, 0.5, 1], ["-0.02em", "0em", "-0.02em"]);
  return (
    <motion.div ref={ref} style={{ scale, y, letterSpacing }} className={className}>
      {children}
    </motion.div>
  );
}
