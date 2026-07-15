"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypewriterProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  onDone?: () => void;
  showCursor?: boolean;
}

export function Typewriter({
  text,
  speed = 14,
  startDelay = 0,
  className,
  onDone,
  showCursor = true,
}: TypewriterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let raf = 0;
    let started = false;
    const startTimer = setTimeout(() => {
      started = true;
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const chars = Math.min(text.length, Math.floor(elapsed / speed));
        setCount(chars);
        if (chars < text.length) {
          raf = requestAnimationFrame(tick);
        } else {
          onDone?.();
        }
      };
      raf = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (started) cancelAnimationFrame(raf);
    };
  }, [text, speed, startDelay, onDone]);

  const done = count >= text.length;

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {text.slice(0, count)}
      {showCursor && !done && <span className="text-profit">▊</span>}
    </span>
  );
}
