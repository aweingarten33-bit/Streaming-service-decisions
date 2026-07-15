"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * ParallaxImg — image that translates against scroll direction, and shifts
 * from grayscale to full color as it enters the viewport. Hover scales +
 * completes the color transition.
 */
export function ParallaxImg({
  src,
  alt,
  className,
  imgClassName,
  amount = 40,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  const grayscale = useTransform(scrollYProgress, [0, 0.4, 0.7], [1, 0.3, 0]);
  const filter = useTransform(grayscale, (g) => `grayscale(${g}) contrast(${1 + (1 - g) * 0.05})`);
  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ""}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y, filter }}
        whileHover={{ scale: 1.04, filter: "grayscale(0) contrast(1.08)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`h-full w-full object-cover will-change-transform ${imgClassName ?? ""}`}
      />
    </div>
  );
}
