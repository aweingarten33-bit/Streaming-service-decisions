"use client";

import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { PROMPT_BANK, getPrompt, type Language } from "@/lib/marquee/copy";

export function PromptSelector({
  language,
  onSelect,
}: {
  language: Language;
  onSelect: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(() =>
    Math.floor(Math.random() * PROMPT_BANK.length),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRotatingIndex((i) => (i + 1) % PROMPT_BANK.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-[14px] text-white/70 transition-colors hover:border-[#E3B24B]/40 hover:text-[#F5EEDC]"
      >
        <span className="truncate">{getPrompt(PROMPT_BANK[rotatingIndex], language)}</span>
        <ChevronDown size={16} className="flex-none text-white/40" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center motion-reduce:transition-none">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[75vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0e0e14] pb-6 pt-3 shadow-2xl motion-reduce:transition-none">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between px-5 py-2">
              <h2 className="font-display text-sm text-white/50">Pick a mood</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-1">
              {PROMPT_BANK.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(getPrompt(option, language));
                    setOpen(false);
                  }}
                  className="block w-full border-b border-white/5 px-5 py-4 text-left text-[15px] text-white/85 transition-colors last:border-b-0 hover:bg-white/5 hover:text-[#F5EEDC]"
                >
                  {getPrompt(option, language)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
