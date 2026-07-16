"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { PROMPT_BANK, getPrompt, type Language } from "@/lib/marquee/copy";

const EASE = [0.76, 0, 0.24, 1] as const;

export function PromptSelector({
  language,
  onSelect,
}: {
  language: Language;
  onSelect: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-press flex w-full items-center justify-between gap-2 rounded-xl border-2 border-rule bg-paper-2 px-4 py-3 text-left text-[14px] font-bold text-ink-2 transition-colors hover:border-red/60 hover:text-ink"
      >
        <span className="truncate">Choose Your Mood</span>
        <ChevronDown size={16} className="flex-none text-ink/40" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-ink/50"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.5, ease: EASE }}
              className="wall-texture relative z-10 max-h-[75vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t-4 border-red bg-paper-2 pb-6 pt-3 shadow-2xl"
            >
              <div className="bg-ink/20 mx-auto mb-2 h-1.5 w-12 rounded-full" />
              <div className="flex items-center justify-between px-5 py-2">
                <h2 className="font-display text-lg tracking-tight text-ink uppercase">
                  Choose Your Mood
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="btn-press bg-ink/10 text-ink-2 grid h-8 w-8 place-items-center rounded-full hover:text-red"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="stencil-rule mx-5" />
              <div className="mt-1">
                {PROMPT_BANK.map((option, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + i * 0.03 }}
                    onClick={() => {
                      onSelect(getPrompt(option, language));
                      setOpen(false);
                    }}
                    className="group border-rule/40 hover:bg-red/5 flex w-full items-baseline gap-3 border-b px-5 py-4 text-left transition-colors last:border-b-0"
                  >
                    <span className="font-mono text-xs font-bold text-ink/30 group-hover:text-red">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-medium text-ink-2 group-hover:text-ink">
                      {getPrompt(option, language)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
