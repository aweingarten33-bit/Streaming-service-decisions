"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Grade = "A" | "B" | "C" | "D" | "F";

const GRADE_COLOR: Record<Grade, string> = {
  A: "text-profit bg-lime/10 border-profit",
  B: "text-profit bg-lime/10 border-profit",
  C: "text-ink bg-orange/10 border-orange",
  D: "text-ink bg-orange/10 border-orange",
  F: "text-hotred bg-hotred/10 border-hotred",
};

export function GradeBadge({
  grade,
  size = "md",
  delay = 0,
}: {
  grade: Grade;
  size?: "sm" | "md" | "lg";
  delay?: number;
}) {
  const sizes = {
    sm: "h-10 w-10 text-2xl border-2",
    md: "h-16 w-16 text-4xl border",
    lg: "h-28 w-28 text-7xl border-4",
  };
  return (
    <motion.div
      initial={{ scale: 0, rotate: -25 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 15, delay }}
      className={cn(
        "flex items-center justify-center font-display leading-none",
        sizes[size],
        GRADE_COLOR[grade],
      )}
    >
      {grade}
    </motion.div>
  );
}
