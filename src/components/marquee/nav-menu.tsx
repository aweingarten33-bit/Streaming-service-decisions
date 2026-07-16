"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type Tab = "home" | "watchlist" | "explore" | "settings";

const ITEMS: { key: Tab; label: string; num: string }[] = [
  { key: "home", label: "HOME", num: "01" },
  { key: "watchlist", label: "WATCHLIST", num: "02" },
  { key: "explore", label: "EXPLORE", num: "03" },
  { key: "settings", label: "SETTINGS", num: "04" },
];

const EASE = [0.76, 0, 0.24, 1] as const;

/** Replaces the old bottom tab bar. Ported from a user-supplied reference
 * ("StreamDecide" + a Banksy-styled pass): a persistent top bar (wordmark +
 * hamburger, mix-blend-difference for automatic contrast) opens a two-panel
 * side drawer -- a textured wall panel slides in first, a red-bordered dark
 * panel a beat behind it -- with numbered nav items, a rotated scrawled
 * watermark, and a spray-stroke underline that grows on hover. */
export function NavMenu({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function select(key: Tab) {
    onChange(key);
    setOpen(false);
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[70] mix-blend-difference">
        <div className="flex items-center justify-between p-5">
          <button
            type="button"
            onClick={() => select("home")}
            className="pointer-events-auto font-display text-xl tracking-tighter text-white uppercase"
          >
            Marquee
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="pointer-events-auto relative flex h-10 w-12 flex-col justify-center gap-2"
          >
            <motion.span
              animate={{
                rotate: open ? 45 : 0,
                y: open ? 8 : 0,
                backgroundColor: open ? "#e3170a" : "currentColor",
              }}
              transition={{ duration: 0.5, ease: EASE }}
              className="h-1 w-full origin-center rounded-full bg-current"
              style={{ filter: "url(#spray-stroke)" }}
            />
            <motion.span
              animate={{ opacity: open ? 0 : 1, x: open ? -20 : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-1 w-4/5 rounded-full bg-current"
            />
            <motion.span
              animate={{
                rotate: open ? -45 : 0,
                y: open ? -8 : 0,
                backgroundColor: open ? "#e3170a" : "currentColor",
              }}
              transition={{ duration: 0.5, ease: EASE }}
              className="h-1 w-full origin-center rounded-full bg-current"
              style={{ filter: "url(#spray-stroke)" }}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-auto absolute inset-0 bg-black"
              onClick={() => setOpen(false)}
            />

            {/* secondary parallax panel -- textured wall, arrives a beat behind */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
              className="wall-texture pointer-events-auto absolute inset-y-0 left-0 w-[92vw] border-r border-rule bg-paper-3 md:w-[65vw]"
            />

            {/* primary panel -- the actual menu content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.8, ease: EASE }}
              className="pointer-events-auto absolute inset-y-0 left-0 flex w-[88vw] flex-col justify-center overflow-hidden border-r-[4px] border-red bg-paper-2 md:w-[60vw]"
            >
              <div className="absolute inset-0 bg-[image:var(--spray-noise)] opacity-20" />

              <nav className="relative z-10 flex flex-col gap-4 px-5 md:gap-10 md:px-16">
                {ITEMS.map(({ key, label, num }, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.3 + i * 0.1 }}
                    className="group relative flex w-fit cursor-pointer items-baseline gap-1.5 md:gap-8"
                    onClick={() => select(key)}
                  >
                    <span
                      className={`font-mono text-xs font-bold transition-colors md:text-sm ${
                        tab === key ? "text-red" : "text-ink/40"
                      } group-hover:text-red`}
                    >
                      {num}
                    </span>

                    <div className="relative overflow-hidden">
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={`spray-glow font-display text-[11vw] leading-[0.95] tracking-tighter uppercase transition-colors duration-300 sm:text-6xl md:text-7xl lg:text-8xl ${
                          tab === key ? "text-red" : "text-ink"
                        } group-hover:text-red`}
                      >
                        {label}
                      </motion.div>
                      <div
                        className="absolute bottom-2 left-0 h-2 w-0 bg-red transition-all duration-500 ease-out group-hover:w-full"
                        style={{ filter: "url(#spray-stroke)" }}
                      />
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="relative mt-12 border-t-2 border-rule pt-8 md:mt-24"
                >
                  <p className="scrawl text-xl text-ink">No decision paralysis. Just press play.</p>
                </motion.div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
