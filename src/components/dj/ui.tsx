"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Disc3 } from "lucide-react";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Editorial kicker — tracked mono metadata label. */
export function Kicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cx("kicker text-muted-foreground", className)}>{children}</span>;
}

/** The Watch DJ wordmark lockup. */
export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const disc = size === "lg" ? 22 : size === "sm" ? 15 : 18;
  const text =
    size === "lg"
      ? "text-2xl"
      : size === "sm"
        ? "text-sm"
        : "text-lg";
  return (
    <span className={cx("inline-flex items-center gap-2 font-display font-black tracking-tight", text, className)}>
      <Disc3 size={disc} className="text-vermilion" strokeWidth={2.25} aria-hidden />
      <span className="uppercase">
        Watch<span className="text-vermilion">.</span>DJ
      </span>
    </span>
  );
}

type ButtonVariant = "ink" | "outline" | "accent" | "ghost";

const buttonBase =
  "inline-flex select-none items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonVariants: Record<ButtonVariant, string> = {
  ink: "border-[1.5px] border-ink bg-ink text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-ink-sm active:translate-x-0 active:translate-y-0 active:shadow-none",
  accent:
    "border-[1.5px] border-ink bg-vermilion text-accent-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-ink-sm active:translate-x-0 active:translate-y-0 active:shadow-none",
  outline:
    "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-primary-foreground",
  ghost: "border-[1.5px] border-transparent text-muted-foreground hover:text-ink",
};

export function Button({
  variant = "ink",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={cx(buttonBase, buttonVariants[variant], "px-5 py-3", className)} {...props}>
      {children}
    </button>
  );
}

/** Rectangular editorial tag / pill. */
export function Tag({
  children,
  active,
  as = "span",
  className,
  ...props
}: {
  children: ReactNode;
  active?: boolean;
  as?: "span" | "button";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cx(
    "inline-flex items-center gap-1.5 border-[1.5px] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
    active
      ? "border-ink bg-ink text-primary-foreground"
      : "border-ink/25 bg-transparent text-ink/70",
    as === "button" && !active && "hover:border-ink hover:text-ink",
    className,
  );
  if (as === "button") {
    return (
      <button type="button" className={cls} {...props}>
        {children}
      </button>
    );
  }
  return <span className={cls}>{children}</span>;
}

/** Section rule with a kicker, editorial masthead style. */
export function SectionLabel({
  label,
  right,
}: {
  label: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b-[1.5px] border-ink pb-2">
      <Kicker className="text-ink">{label}</Kicker>
      {right}
    </div>
  );
}
