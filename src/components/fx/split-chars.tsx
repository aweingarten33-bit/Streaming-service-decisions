"use client";

import { motion } from "framer-motion";

/**
 * Character-by-character reveal. Each letter rides its own mask, rising from
 * below with a soft blur-to-sharp transition. Staggered across the word/line
 * for that hallmark "premium motion" feel.
 */
export function SplitChars({
  text,
  className,
  charClass,
  stagger = 0.028,
  delay = 0,
  duration = 0.9,
  once = false,
}: {
  text: string;
  className?: string;
  charClass?: string;
  stagger?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.35 }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      className={className}
      style={{ display: "inline-block" }}
    >
      {words.map((w, wi) => (
        <span
          key={wi}
          style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.28em" }}
        >
          {Array.from(w).map((c, ci) => (
            <span
              key={ci}
              className={charClass}
              style={{
                display: "inline-block",
                overflow: "hidden",
                paddingBottom: "0.14em",
                verticalAlign: "bottom",
              }}
            >
              <motion.span
                variants={{
                  hidden: { y: "115%", opacity: 0, filter: "blur(10px)" },
                  show: {
                    y: "0%",
                    opacity: 1,
                    filter: "blur(0px)",
                    transition: { duration, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                style={{ display: "inline-block" }}
              >
                {c}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </motion.span>
  );
}
