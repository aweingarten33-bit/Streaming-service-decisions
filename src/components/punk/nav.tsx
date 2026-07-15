"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "HOME" },
  { href: "/upload", label: "UPLOAD" },
  { href: "/reports", label: "REPORTS" },
  { href: "/validator", label: "VALIDATOR" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05060a]/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-8">
        {/* left: menu toggle + wordmark */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center border border-white/40 md:hidden"
          >
            <div className="flex flex-col gap-1">
              <span
                className={cn("h-0.5 w-5 bg-white transition", open && "translate-y-1.5 rotate-45")}
              />
              <span className={cn("h-0.5 w-5 bg-white transition", open && "opacity-0")} />
              <span
                className={cn(
                  "h-0.5 w-5 bg-white transition",
                  open && "-translate-y-1.5 -rotate-45",
                )}
              />
            </div>
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-display text-xl font-bold leading-none tracking-tight text-white sm:text-2xl">
              DFS Strategy Auditor
            </span>
          </Link>
        </div>

        {/* center: nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative font-mono text-[11px] font-medium uppercase tracking-[0.2em] transition-colors",
                  active ? "text-white" : "text-white/45 hover:text-white",
                )}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 h-px w-full bg-orange"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* right: status chip (keeps the layout balanced, no CTA) */}
        <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 md:flex">
          <span className="h-1.5 w-1.5 bg-orange" />
          COACH // NOT OPTIMIZER
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 md:hidden"
          >
            <div className="flex flex-col px-4">
              {LINKS.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "border-b border-white/10 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em]",
                      active ? "text-orange" : "text-white",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
