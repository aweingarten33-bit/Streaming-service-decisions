"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type Tab = "home" | "watchlist" | "explore" | "settings" | "about";

const ITEMS: { key: Tab; label: string; num: string }[] = [
  { key: "home", label: "HOME", num: "01" },
  { key: "watchlist", label: "WATCHLIST", num: "02" },
  { key: "explore", label: "EXPLORE", num: "03" },
  { key: "settings", label: "SETTINGS", num: "04" },
  { key: "about", label: "ABOUT", num: "05" },
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
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-[70] transition-colors ${
          open ? "" : "bg-paper grid-paper border-rule/10 border-b"
        }`}
      >
        <div className="flex items-center justify-between p-5">
          {open ? (
            <button
              type="button"
              onClick={() => select("home")}
              className="stencil-box pointer-events-auto bg-paper text-ink font-display rounded-md px-3 py-1 text-xl tracking-tighter uppercase"
            >
              Marquee
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className={`pointer-events-auto relative flex h-10 w-12 flex-col justify-center gap-2 transition-colors ${open ? "text-white" : "text-ink"}`}
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

            {/* secondary parallax panel -- textured wall, arrives a beat behind.
                Hardcoded dark colors, not the app's (now light) tokens -- this
                menu is the deliberate day/night exception, per the reference. */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
              className="pointer-events-auto absolute inset-y-0 left-0 w-[92vw] border-r border-white/10 bg-[#1a1a1a] md:w-[65vw]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent 2px, rgb(255 255 255 / 3%) 2px, rgb(255 255 255 / 3%) 4px), repeating-linear-gradient(0deg, transparent, transparent 8px, rgb(255 255 255 / 4%) 8px, rgb(255 255 255 / 4%) 9px)",
              }}
            />

            {/* primary panel -- the actual menu content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.8, ease: EASE }}
              className="pointer-events-auto absolute inset-y-0 left-0 flex w-[88vw] flex-col items-stretch justify-center overflow-hidden border-r-[4px] border-red bg-[#0f0f0f] md:w-[60vw]"
            >
              <div className="absolute inset-0 bg-[image:var(--spray-noise)] opacity-20" />

              <nav className="relative z-10 flex max-h-full w-full flex-col gap-2 overflow-y-auto px-5 py-6 md:gap-6 md:px-16">
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
                        tab === key ? "text-red" : "text-white/40"
                      } group-hover:text-red`}
                    >
                      {num}
                    </span>

                    <div className="relative overflow-hidden">
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={`font-display text-[8.5vw] leading-[0.95] tracking-tighter uppercase transition-colors duration-300 sm:text-5xl md:text-6xl lg:text-7xl ${
                          tab === key ? "text-red" : "text-white"
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
                  className="relative mt-6 shrink-0 border-t-2 border-white/20 pt-6 md:mt-10"
                >
                  <p className="scrawl text-lg" style={{ color: "#fff" }}>
                    No decision paralysis. Just press play.
                  </p>
                </motion.div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
