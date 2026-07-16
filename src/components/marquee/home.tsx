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

/** Cheap, instant, no network call -- keyword-matches the typed prompt to lead with a more specific loading line before falling back to the generic rotation. */
function flavoredLoadingMessages(text: string, generic: string[]): string[] {
  const lower = text.toLowerCase();
  const flavored: string[] = [];
  if (/\b(dark|thriller|scary|horror)\b/.test(lower))
    flavored.push("Digging through the dark stuff…");
  if (/\b(funny|laugh|comedy)\b/.test(lower))
    flavored.push("Looking for something actually funny…");
  if (/\b(\d{2,3})\s*(min|minutes)\b/.test(lower) || /\b(90|ninety)\b/.test(lower)) {
    flavored.push("Checking what actually fits your time…");
  }
  if (/\bphone\b/.test(lower))
    flavored.push("Finding something that survives you checking your phone…");
  if (/\bweird\b/.test(lower)) flavored.push("Hunting for the good kind of weird…");
  return flavored.length > 0 ? [...flavored, ...generic] : generic;
}

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
  const [groupMode, setGroupMode] = useState<"solo" | "two" | "group">("solo");
  const [pendingRejection, setPendingRejection] = useState<"another" | "idle" | null>(null);
  const [teaser, setTeaser] = useState<string | null>(null);
  const lastPrompt = useRef("");
  const excludeIds = useRef<number[]>([]);
  const lastRejected = useRef<{ tmdbId: number; mediaType: string } | null>(null);
  const activeLoadingMessages = useRef(copy.loadingMessages);

  useEffect(() => {
    deviceFetch(`/api/home-teaser?language=${language}`)
      .then((res) => res.json())
      .then((data) => setTeaser(data.teaser ?? null))
      .catch(() => setTeaser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (state.kind !== "loading") return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % activeLoadingMessages.current.length;
      setLoadingMessage(activeLoadingMessages.current[i]);
    }, 1400);
    return () => clearInterval(id);
  }, [state.kind]);

  function promptWithGroupMode(text: string) {
    if (groupMode === "two")
      return `${text}. Pick something good for two people watching together; avoid polarizing choices.`;
    if (groupMode === "group")
      return `${text}. Pick something for a group; favor crowd-pleasing, easy-to-agree-on titles.`;
    return text;
  }

  async function decide(text: string, relax = false, rejectionReason = "") {
    activeLoadingMessages.current = flavoredLoadingMessages(text, copy.loadingMessages);
    setState({ kind: "loading" });
    setLoadingMessage(activeLoadingMessages.current[0]);
    try {
      const res = await deviceFetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptWithGroupMode(text),
          excludeTmdbIds: excludeIds.current,
          relax,
          mediaType: mediaTypeFilter,
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
      <h1 className="stagger-in font-display text-center text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {"WTF are you in the mood for?"}
      </h1>
      <div className="stencil-rule stagger-in stagger-in-1 mx-auto mt-4 w-10" />
      {teaser && (
        <p className="stagger-in stagger-in-2 mt-3 text-center text-sm text-ink-2">{teaser}</p>
      )}

      <div
        role="group"
        aria-label="Movie or TV show"
        className="stagger-in stagger-in-2 mt-6 flex w-full gap-2 rounded-xl border-2 border-rule bg-paper-2 p-1"
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
            className={`btn-press flex-1 rounded-lg py-2 text-[13px] font-bold transition-colors ${
              mediaTypeFilter === value ? "bg-red text-red-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stagger-in stagger-in-3 mt-3 w-full space-y-3">
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
              className={`btn-press rounded-full border-2 px-3 py-2 text-xs font-bold ${
                groupMode === value
                  ? "border-rule bg-red text-red-ink"
                  : "border-rule bg-paper-2 text-ink-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-ink/50">
          Choose from the dropdown above, or just type how you feel below.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(prompt);
          }}
          className="shadow-stamp-sm stagger-in stagger-in-4 flex items-center gap-2 rounded-2xl border-2 border-rule bg-paper-2 px-3 py-2 transition-colors focus-within:border-red"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={copy.inputPlaceholder}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={state.kind === "loading"}
            aria-label="Send"
            className="btn-press grid h-10 w-10 flex-none place-items-center rounded-xl border-2 border-rule bg-red text-red-ink hover:brightness-110 disabled:opacity-50"
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>

      <div className="mt-8 w-full">
        {interstitial && <p className="mb-3 text-center text-sm text-ink-2">{interstitial}</p>}

        {state.kind === "loading" && (
          <p
            className="loading-dots text-center text-sm text-ink-2"
            role="status"
            aria-live="polite"
          >
            {loadingMessage}
          </p>
        )}

        {state.kind === "result" && (
          <div className="envelope-reveal spotlight-glow">
            <ResultCard
              result={state.result}
              intent={state.intent}
              language={language}
              onGiveMeAnother={giveMeAnother}
              onNotTonight={notTonight}
              onMarkWatched={markWatched}
            />
          </div>
        )}

        {pendingRejection && (
          <div className="rounded-2xl border-2 border-rule bg-paper-2 p-4">
            <p className="text-sm font-bold text-ink">What was wrong with that one?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Too heavy", "Too long", "Wrong vibe", "Not for the room", "Already seen"].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => rejectWithReason(reason)}
                    className="btn-press rounded-xl border-2 border-rule bg-paper px-3 py-2 text-xs font-bold text-ink-2"
                  >
                    {reason}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {state.kind === "emptyWatchlist" && (
          <div className="rounded-2xl border-2 border-rule bg-paper-2 px-5 py-6 text-center">
            <p className="text-sm text-ink-2">{copy.emptyWatchlist}</p>
            <button
              type="button"
              onClick={onNeedsImport}
              className="btn-press shadow-stamp-sm mt-4 rounded-xl border-2 border-rule bg-red px-5 py-2.5 text-sm font-bold text-red-ink"
            >
              {copy.emptyWatchlistAction}
            </button>
          </div>
        )}

        {state.kind === "noMatch" && (
          <div className="rounded-2xl border-2 border-rule bg-paper-2 px-5 py-6 text-center">
            <p className="text-sm text-ink-2">{copy.noMatch}</p>
            {!state.relaxed && (
              <button
                type="button"
                onClick={() => decide(lastPrompt.current, true)}
                className="btn-press shadow-stamp-sm mt-4 rounded-xl border-2 border-rule bg-red px-5 py-2.5 text-sm font-bold text-red-ink"
              >
                {copy.relaxAction}
              </button>
            )}
          </div>
        )}

        {state.kind === "error" && (
          <p className="text-center text-sm font-bold text-red">{state.message}</p>
        )}
      </div>
    </div>
  );
}
