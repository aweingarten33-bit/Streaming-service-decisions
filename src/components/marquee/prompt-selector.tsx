"use client";

import { useState } from "react";
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-press flex w-full items-center justify-between gap-2 rounded-xl border border-rule bg-ink/5 px-4 py-3 text-left text-[14px] text-ink-2 transition-colors hover:border-red/40 hover:text-ink"
      >
        <span className="truncate">Choose Your Mood</span>
        <ChevronDown size={16} className="flex-none text-ink/40" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center motion-reduce:transition-none">
          <div
            className="absolute inset-0 bg-paper/80"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[75vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-rule bg-paper-2 pb-6 pt-3 shadow-2xl motion-reduce:transition-none">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink/20" />
            <div className="flex items-center justify-between px-5 py-2">
              <h2 className="font-display text-sm text-ink-2">Please Choose Your Mood</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="btn-press grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink-2"
              >
                <X size={16} />
              </button>
            </div>
            <div className="stencil-rule mx-5" />
            <div className="mt-1">
              {PROMPT_BANK.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(getPrompt(option, language));
                    setOpen(false);
                  }}
                  className="block w-full border-b border-rule px-5 py-4 text-left text-[15px] text-ink/85 transition-colors last:border-b-0 hover:bg-ink/5 hover:text-ink"
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
