"use client";

import { motion } from "framer-motion";

/**
 * Word-by-word scroll reveal. Each word is a mask with an inner span that
 * rises + un-blurs. Staggered across the whole line.
 */
export function SplitWords({
  text,
  className,
  wordClass,
  stagger = 0.045,
  once = true,
}: {
  text: string;
  className?: string;
  wordClass?: string;
  stagger?: number;
  once?: boolean;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.4 }}
      transition={{ staggerChildren: stagger }}
      className={className}
      style={{ display: "inline-block" }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          className={wordClass}
          style={{
            display: "inline-block",
            overflow: "hidden",
            paddingBottom: "0.12em",
            marginRight: "0.28em",
          }}
        >
          <motion.span
            variants={{
              hidden: { y: "110%", opacity: 0, filter: "blur(6px)" },
              show: {
                y: "0%",
                opacity: 1,
                filter: "blur(0px)",
                transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            style={{ display: "inline-block" }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
