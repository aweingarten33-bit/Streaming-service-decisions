"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { streamingServices } from "../../../config/streaming-services";
import { genres } from "../../../config/genres";
import { getDeviceId } from "@/lib/device-id";
import { Button, Kicker, Sprockets, Tag, Wordmark } from "./ui";

const WATCHES_WITH = ["Solo", "Partner", "Family", "Friends", "Roommates"];

const STEPS = [
  {
    key: "watchesWith",
    no: "S.01",
    label: "The Company",
    question: "Who's usually on the couch?",
    hint: "Pick one — it shapes tone and runtime.",
  },
  {
    key: "services",
    no: "S.02",
    label: "The Library",
    question: "Which services do you carry?",
    hint: "So every pick is one you can actually press play on.",
  },
  {
    key: "favoriteGenres",
    no: "S.03",
    label: "The Leanings",
    question: "What do you gravitate toward?",
    hint: "Optional. Choose as many as you like.",
  },
  {
    key: "avoidGenres",
    no: "S.04",
    label: "The Hard Passes",
    question: "Anything you'd rather never see?",
    hint: "Optional. We'll keep these off the marquee.",
  },
] as const;

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [watchesWith, setWatchesWith] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [avoidGenres, setAvoidGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];

  const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: getDeviceId(),
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

  const canAdvance = current.key === "watchesWith" ? watchesWith !== null : true;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="relative z-10 min-h-screen bg-background">
      {/* Masthead */}
      <div className="mx-auto max-w-xl px-5">
        <Sprockets className="mt-0" />
        <div className="flex items-center justify-between py-4">
          <Wordmark size="sm" />
          <Kicker>Charter Card</Kicker>
        </div>
        <hr className="rule-ink" />
      </div>

      {/* Progress ticker */}
      <div className="mx-auto mt-4 max-w-xl px-5">
        <div className="flex items-stretch gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 border border-ink transition-colors ${
                i <= step ? "bg-vermilion" : "bg-transparent"
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Kicker>
            {current.no} — {current.label}
          </Kicker>
          <Kicker>
            {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </Kicker>
        </div>
      </div>

      {/* Question card */}
      <div className="mx-auto mt-8 flex max-w-xl flex-col px-5">
        <div key={current.key} className="rise-in">
          <h1 className="text-balance font-display text-3xl font-black leading-[1.05] tracking-tight text-ink sm:text-4xl">
            {current.question}
          </h1>
          <p className="mt-3 max-w-sm font-serif text-[15px] italic leading-relaxed text-muted-foreground">
            {current.hint}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {current.key === "watchesWith" &&
              WATCHES_WITH.map((w) => (
                <Tag
                  key={w}
                  as="button"
                  active={watchesWith === w}
                  onClick={() => setWatchesWith(w)}
                  className="text-[11px]"
                >
                  {w}
                </Tag>
              ))}

            {current.key === "services" &&
              streamingServices.map((s) => (
                <Tag
                  key={s.label}
                  as="button"
                  active={services.includes(s.tmdbProvider)}
                  onClick={() => toggle(services, setServices, s.tmdbProvider)}
                  className="text-[11px]"
                >
                  {s.label}
                </Tag>
              ))}

            {current.key === "favoriteGenres" &&
              genres.map((g) => (
                <Tag
                  key={g}
                  as="button"
                  active={favoriteGenres.includes(g)}
                  onClick={() => toggle(favoriteGenres, setFavoriteGenres, g)}
                  className="text-[11px]"
                >
                  {g}
                </Tag>
              ))}

            {current.key === "avoidGenres" &&
              genres.map((g) => (
                <Tag
                  key={g}
                  as="button"
                  active={avoidGenres.includes(g)}
                  onClick={() => toggle(avoidGenres, setAvoidGenres, g)}
                  className="text-[11px]"
                >
                  {g}
                </Tag>
              ))}
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="fixed inset-x-0 bottom-0 bg-background/90 backdrop-blur-md">
        <hr className="rule-hair" />
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-5 py-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="focus-ink inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-ink"
            >
              <ArrowLeft size={13} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onDone}
              className="focus-ink font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-ink"
            >
              Skip setup
            </button>
          )}

          <Button
            type="button"
            variant={isLast ? "accent" : "ink"}
            disabled={!canAdvance || saving}
            onClick={() => (isLast ? finish() : setStep(step + 1))}
          >
            {isLast ? (saving ? "Issuing…" : "Issue my card") : "Next"}
            {!isLast && <ArrowRight size={15} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
