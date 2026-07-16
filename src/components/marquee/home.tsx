"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { getCopy, type Language } from "@/lib/marquee/copy";
import type { DecideIntent } from "@/lib/marquee/intent";
import { useDeviceFetch } from "./use-device-fetch";
import { PromptSelector } from "./prompt-selector";
import { ResultCard, type DecideResult } from "./result-card";

type DecideState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; result: DecideResult; intent: DecideIntent }
  | { kind: "emptyWatchlist" }
  | { kind: "noMatch"; intent: DecideIntent; relaxed: boolean }
  | { kind: "error"; message: string };

type MediaTypeFilter = "any" | "movie" | "tv";

export function Home({
  language,
  onNeedsImport,
}: {
  language: Language;
  onNeedsImport: () => void;
}) {
  const deviceFetch = useDeviceFetch();
  const copy = getCopy(language);
  const [prompt, setPrompt] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("any");
  const [state, setState] = useState<DecideState>({ kind: "idle" });
  const [loadingMessage, setLoadingMessage] = useState(copy.loadingMessages[0]);
  const [interstitial, setInterstitial] = useState<string | null>(null);
  const [useSavedLists, setUseSavedLists] = useState(false);
  const [groupMode, setGroupMode] = useState<"solo" | "two" | "group">("solo");
  const [pendingRejection, setPendingRejection] = useState<"another" | "idle" | null>(null);
  const lastPrompt = useRef("");
  const excludeIds = useRef<number[]>([]);
  const lastRejected = useRef<{ tmdbId: number; mediaType: "movie" | "tv" } | null>(null);

  useEffect(() => {
    if (state.kind !== "loading") return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % copy.loadingMessages.length;
      setLoadingMessage(copy.loadingMessages[i]);
    }, 1400);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind]);

  function promptWithGroupMode(text: string) {
    if (groupMode === "two")
      return `${text}. Pick something good for two people watching together; avoid polarizing choices.`;
    if (groupMode === "group")
      return `${text}. Pick something for a group; favor crowd-pleasing, easy-to-agree-on titles.`;
    return text;
  }

  async function decide(text: string, relax = false, rejectionReason = "") {
    setState({ kind: "loading" });
    setLoadingMessage(copy.loadingMessages[0]);
    try {
      const res = await deviceFetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptWithGroupMode(text),
          excludeTmdbIds: excludeIds.current,
          relax,
          mediaType: mediaTypeFilter,
          useSavedLists,
          rejectionReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: data.error ?? "Something went wrong." });
        return;
      }
      if (data.emptyWatchlist) {
        setState({ kind: "emptyWatchlist" });
        return;
      }
      if (data.noMatch) {
        setState({ kind: "noMatch", intent: data.intent, relaxed: data.relaxed });
        return;
      }
      setState({ kind: "result", result: data.result, intent: data.intent });
    } catch {
      setState({ kind: "error", message: "Something went wrong." });
    }
  }

  function submit(text: string) {
    if (!text.trim() || state.kind === "loading") return;
    lastPrompt.current = text;
    excludeIds.current = [];
    setPendingRejection(null);
    setPrompt("");
    decide(text);
  }

  function giveMeAnother() {
    if (state.kind !== "result") return;
    excludeIds.current = [...excludeIds.current, state.result.tmdbId];
    lastRejected.current = { tmdbId: state.result.tmdbId, mediaType: state.result.mediaType };
    setPendingRejection("another");
  }

  function notTonight() {
    if (state.kind !== "result") return;
    excludeIds.current = [...excludeIds.current, state.result.tmdbId];
    lastRejected.current = { tmdbId: state.result.tmdbId, mediaType: state.result.mediaType };
    setPendingRejection("idle");
  }

  async function rejectWithReason(reason: string) {
    // "Already seen" isn't just a mood hint for the next pick -- it means
    // this title really is watched, so mark it for real instead of only
    // excluding it for this session.
    if (reason === "Already seen" && lastRejected.current) {
      await deviceFetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lastRejected.current, status: "watched" }),
      });
    }
    if (Math.random() < 0.4) {
      const lines = copy.giveMeAnotherInterstitials;
      setInterstitial(lines[Math.floor(Math.random() * lines.length)]);
      setTimeout(() => setInterstitial(null), 1600);
    }
    const next = pendingRejection;
    setPendingRejection(null);
    if (next === "another") decide(lastPrompt.current, false, reason);
    else setState({ kind: "idle" });
  }

  async function markWatched() {
    if (state.kind !== "result") return;
    await deviceFetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdbId: state.result.tmdbId,
        mediaType: state.result.mediaType,
        status: "watched",
      }),
    });
    setState({ kind: "idle" });
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 pb-28 pt-16">
      <h1 className="font-display text-center text-4xl font-semibold tracking-tight text-[#F5EEDC] sm:text-5xl">
        {"WTF are you in the mood for?"}
      </h1>

      <div
        role="group"
        aria-label="Movie or TV show"
        className="mt-6 flex w-full gap-2 rounded-xl border border-white/10 bg-white/5 p-1"
      >
        {(
          [
            ["any", "Any"],
            ["movie", "Movie"],
            ["tv", "TV Show"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mediaTypeFilter === value}
            onClick={() => setMediaTypeFilter(value)}
            className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors ${
              mediaTypeFilter === value
                ? "bg-[#E3B24B]/15 text-[#F5EEDC]"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 w-full space-y-3">
        <PromptSelector language={language} onSelect={setPrompt} />
        <div className="grid grid-cols-3 gap-2">
          {[
            ["solo", "Solo"],
            ["two", "For two"],
            ["group", "Group"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setGroupMode(value as typeof groupMode)}
              className={`rounded-full border px-3 py-2 text-xs font-medium ${
                groupMode === value
                  ? "border-[#E3B24B]/60 bg-[#E3B24B]/15 text-[#F5EEDC]"
                  : "border-white/10 bg-white/5 text-white/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
          <input
            type="checkbox"
            checked={useSavedLists}
            onChange={(e) => setUseSavedLists(e.target.checked)}
            className="accent-[#E3B24B]"
          />
          Let saved IMDb lists influence this pick
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(prompt);
          }}
          className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-xl transition-colors focus-within:border-[#E3B24B]/50"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={copy.inputPlaceholder}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-[#F5EEDC] placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={state.kind === "loading"}
            aria-label="Send"
            className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] text-[#181104] transition-transform hover:brightness-110 disabled:opacity-50"
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>

      <div className="mt-8 w-full">
        {interstitial && <p className="mb-3 text-center text-sm text-white/50">{interstitial}</p>}

        {state.kind === "loading" && (
          <p className="text-center text-sm text-white/50" role="status" aria-live="polite">
            {loadingMessage}
          </p>
        )}

        {state.kind === "result" && (
          <ResultCard
            result={state.result}
            intent={state.intent}
            language={language}
            onGiveMeAnother={giveMeAnother}
            onNotTonight={notTonight}
            onMarkWatched={markWatched}
          />
        )}

        {pendingRejection && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-[#F5EEDC]">What was wrong with that one?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Too heavy", "Too long", "Wrong vibe", "Not for the room", "Already seen"].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => rejectWithReason(reason)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-white/70"
                  >
                    {reason}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {state.kind === "emptyWatchlist" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center">
            <p className="text-sm text-white/70">{copy.emptyWatchlist}</p>
            <button
              type="button"
              onClick={onNeedsImport}
              className="mt-4 rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] px-5 py-2.5 text-sm font-semibold text-[#181104]"
            >
              {copy.emptyWatchlistAction}
            </button>
          </div>
        )}

        {state.kind === "noMatch" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center">
            <p className="text-sm text-white/70">{copy.noMatch}</p>
            {!state.relaxed && (
              <button
                type="button"
                onClick={() => decide(lastPrompt.current, true)}
                className="mt-4 rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] px-5 py-2.5 text-sm font-semibold text-[#181104]"
              >
                {copy.relaxAction}
              </button>
            )}
          </div>
        )}

        {state.kind === "error" && (
          <p className="text-center text-sm text-red-300/90">{state.message}</p>
        )}
      </div>
    </div>
  );
}
