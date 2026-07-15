"use client";

import type { Language } from "@/lib/marquee/copy";

export function SettingsScreen({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-28 pt-16">
      <h1 className="font-display text-2xl font-semibold text-[#F5EEDC]">Settings</h1>

      <div className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">Language</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onLanguageChange("unfiltered")}
            className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors ${
              language === "unfiltered"
                ? "border-[#E3B24B]/50 bg-[#E3B24B]/10 text-[#F5EEDC]"
                : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            Unfiltered
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange("clean")}
            className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors ${
              language === "clean"
                ? "border-[#E3B24B]/50 bg-[#E3B24B]/10 text-[#F5EEDC]"
                : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            Clean-ish
          </button>
        </div>
        <p className="mt-2 text-xs text-white/40">
          Unfiltered keeps the swearing. Clean-ish keeps the personality, drops the harder stuff.
        </p>
      </div>

      <div className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">Your Data</p>
        <p className="mt-2 text-sm text-white/60">
          No account, no signup. Your watchlist lives on this device only -- clearing your browser
          data or switching devices means starting over.
        </p>
      </div>
    </div>
  );
}
