"use client";

import { useState } from "react";
import { streamingServices } from "../../../config/streaming-services";
import { genres } from "../../../config/genres";
import { getDeviceId } from "@/lib/device-id";

const WATCHES_WITH = ["Solo", "Partner", "Family", "Friends", "Roommates"];

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        selected
          ? "border-[#E3B24B] bg-[#E3B24B]/15 text-[#F5EEDC]"
          : "border-white/15 bg-black/30 text-white/70 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

const STEPS = ["watchesWith", "services", "favoriteGenres", "avoidGenres"] as const;

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [watchesWith, setWatchesWith] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [avoidGenres, setAvoidGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  async function finish() {
    setSaving(true);
    try {
      const deviceId = getDeviceId();
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          watchesWith,
          streamingServices: services,
          favoriteGenres,
          avoidGenres,
        }),
      });
    } catch {
      // Non-fatal — the DJ still works without saved preferences.
    } finally {
      localStorage.setItem("watchdj_onboarded", "true");
      setSaving(false);
      onDone();
    }
  }

  const canAdvance =
    (STEPS[step] === "watchesWith" && watchesWith !== null) ||
    STEPS[step] === "services" ||
    STEPS[step] === "favoriteGenres" ||
    STEPS[step] === "avoidGenres";

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full">
        {STEPS[step] === "watchesWith" && (
          <>
            <h2 className="font-display text-2xl text-[#F5EEDC]">Who do you usually watch with?</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {WATCHES_WITH.map((w) => (
                <Chip key={w} selected={watchesWith === w} onClick={() => setWatchesWith(w)}>
                  {w}
                </Chip>
              ))}
            </div>
          </>
        )}

        {STEPS[step] === "services" && (
          <>
            <h2 className="font-display text-2xl text-[#F5EEDC]">Which services do you have?</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {streamingServices.map((s) => (
                <Chip
                  key={s.label}
                  selected={services.includes(s.tmdbProvider)}
                  onClick={() => toggle(services, setServices, s.tmdbProvider)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </>
        )}

        {STEPS[step] === "favoriteGenres" && (
          <>
            <h2 className="font-display text-2xl text-[#F5EEDC]">Favorite genres?</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {genres.map((g) => (
                <Chip
                  key={g}
                  selected={favoriteGenres.includes(g)}
                  onClick={() => toggle(favoriteGenres, setFavoriteGenres, g)}
                >
                  {g}
                </Chip>
              ))}
            </div>
          </>
        )}

        {STEPS[step] === "avoidGenres" && (
          <>
            <h2 className="font-display text-2xl text-[#F5EEDC]">Any genres to avoid?</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {genres.map((g) => (
                <Chip
                  key={g}
                  selected={avoidGenres.includes(g)}
                  onClick={() => toggle(avoidGenres, setAvoidGenres, g)}
                >
                  {g}
                </Chip>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-white/40 hover:text-white/60"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={!canAdvance || saving}
            onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
            className="rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] px-6 py-2.5 font-semibold text-[#181104] transition-transform hover:brightness-110 disabled:opacity-40"
          >
            {step === STEPS.length - 1 ? (saving ? "Saving…" : "Start watching") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
