"use client";

import { useEffect, useState } from "react";
import { Compass, Home as HomeIcon, ListVideo, Settings as SettingsIcon } from "lucide-react";

export type Tab = "home" | "watchlist" | "explore" | "settings";

const ITEMS: { key: Tab; label: string; icon: typeof HomeIcon }[] = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "watchlist", label: "My Watchlist", icon: ListVideo },
  { key: "explore", label: "Explore", icon: Compass },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

/** Replaces the old bottom tab bar. A circular toggle morphs hamburger -> X;
 * opening slides a skewed panel across the screen (a stencil "blade" cutting
 * in at an angle, not a plain slide/fade), matching a provided reference
 * video. `openId` increments on every open so the stagger/spray-reveal
 * keyframes replay each time instead of only on first mount. */
export function NavMenu({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState(0);

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

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) setOpenId((id) => id + 1);
      return next;
    });
  }

  function select(key: Tab) {
    onChange(key);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="btn-press fixed top-5 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full border-2 border-rule bg-paper shadow-stamp-sm"
      >
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 block h-[2px] w-5 bg-ink transition-all duration-300 ${
              open ? "top-[7px] rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute top-[7px] left-0 block h-[2px] w-5 bg-ink transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 block h-[2px] w-5 bg-ink transition-all duration-300 ${
              open ? "top-[7px] -rotate-45" : "top-[14px]"
            }`}
          />
        </span>
      </button>

      <div
        className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* the diagonal wipe -- a wide skewed panel sliding in from off-screen,
            its skewed vertical edges read as a blade cutting across the
            screen rather than a straight slide or fade. */}
        <div
          className="absolute -inset-y-[15%] -right-[35%] -left-[35%] border-x-[3px] border-red bg-paper-2"
          style={{
            transform: `skewX(-12deg) translateX(${open ? "0%" : "120%"})`,
            transition: "transform 550ms cubic-bezier(0.76, 0, 0.24, 1)",
          }}
        />

        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
            open ? "opacity-100 delay-[250ms]" : "opacity-0"
          }`}
        >
          <div
            key={openId}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full flex-col items-center justify-center gap-12 px-6"
          >
            <div className="paint-drip spray-reveal spotlight-glow text-center">
              <p className="font-display text-red text-6xl tracking-[0.08em] uppercase sm:text-7xl">
                Marquee
              </p>
            </div>

            <nav className="flex flex-col items-center gap-7" onClick={(e) => e.stopPropagation()}>
              {ITEMS.map(({ key, label, icon: Icon }, i) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={`stagger-in btn-press flex items-center gap-3 font-display text-2xl tracking-wide uppercase transition-colors ${
                    tab === key ? "text-red" : "text-ink"
                  }`}
                  style={{ animationDelay: `${0.3 + i * 0.07}s` }}
                >
                  <Icon size={22} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
