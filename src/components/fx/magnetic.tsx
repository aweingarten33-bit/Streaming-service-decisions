"use client";

import { useRef, type ReactNode } from "react";

/** Magnetic hover — element pulls toward the cursor within its bounds. */
export function Magnetic({
  children,
  strength = 0.35,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ display: "inline-block", transition: "transform 450ms cubic-bezier(.2,.9,.3,1)" }}
    >
      {children}
    </span>
  );
}
