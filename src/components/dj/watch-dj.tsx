"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, ArrowUp } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { TitleDetail } from "./title-detail";

interface Pick {
  tmdbId: number;
  title: string;
  year: number | null;
  mediaType: string;
  posterPath: string | null;
  rating: number | null;
  ratingSource: string | null;
  voteCount: number | null;
  genres: string[];
  streamingProviders: string[];
  why: string;
}

interface ParsedFilters {
  media_type: "movie" | "tv" | "any";
  descriptors: string[];
  max_runtime_minutes: number | null;
  genre_hints: string[];
}

interface Turn {
  prompt: string;
  picks: Pick[] | null;
  error: string | null;
}

const CHIPS = [
  { emoji: "🎬", label: "Hidden Gems", prompt: "Show me a hidden gem nobody talks about" },
  { emoji: "😱", label: "Mind-Bending", prompt: "I want something mind-bending" },
  { emoji: "😂", label: "Funny Tonight", prompt: "I need something funny tonight" },
  {
    emoji: "📺",
    label: "One-Season Series",
    prompt: "A great one-season series with a complete story",
  },
  { emoji: "🎥", label: "Documentary", prompt: "An unbelievable documentary" },
  { emoji: "🎲", label: "Surprise Me", prompt: "I don't know what I want, surprise me" },
];

const TMDB_IMG = "https://image.tmdb.org/t/p";

export function WatchDj({ backdrops }: { backdrops: string[] }) {
  const [bgIndex, setBgIndex] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [detail, setDetail] = useState<{ tmdbId: number; mediaType: string } | null>(null);
  const shownIds = useRef<number[]>([]);
  const lastFilters = useRef<ParsedFilters | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backdrops.length < 2) return;
    const id = setInterval(() => setBgIndex((i) => (i + 1) % backdrops.length), 7000);
    return () => clearInterval(id);
  }, [backdrops.length]);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) {
        setPrompt(text);
        ask(text);
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  async function ask(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    const turnIndex = turns.length;
    setTurns((t) => [...t, { prompt: text, picks: null, error: null }]);
    setPrompt("");

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          deviceId: getDeviceId(),
          excludeIds: shownIds.current,
          previousFilters: lastFilters.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      const picks: Pick[] = data.results ?? [];
      shownIds.current = [...shownIds.current, ...picks.map((p) => p.tmdbId)];
      lastFilters.current = data.filters ?? null;
      setTurns((t) => {
        const next = [...t];
        next[turnIndex] = { prompt: text, picks, error: null };
        return next;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setTurns((t) => {
        const next = [...t];
        next[turnIndex] = { prompt: text, picks: null, error: message };
        return next;
      });
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  const started = turns.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10">
        {backdrops.length > 0 ? (
          backdrops.map((path, i) => (
            <div
              key={path}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
              style={{
                backgroundImage: `url(${TMDB_IMG}/original${path})`,
                opacity: i === bgIndex ? 1 : 0,
              }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a14] via-[#08080c] to-[#0e1420]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-6 pb-40 pt-24">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-[#F5EEDC] sm:text-6xl">
          Watch DJ
        </h1>
        <p className="mt-3 text-center text-base text-white/60">Your personal movie &amp; TV DJ</p>
        {!started && (
          <p className="mt-2 max-w-xs text-center font-mono text-[11px] uppercase tracking-wider text-[#E3B24B]/80">
            Powered by a network of trusted entertainment recommendations
          </p>
        )}

        {!started && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(prompt);
              }}
              className="mt-10 w-full"
            >
              <PromptBar
                value={prompt}
                onChange={setPrompt}
                onVoice={toggleVoice}
                listening={listening}
                voiceSupported={!!recognitionRef.current}
                loading={loading}
              />
            </form>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => ask(chip.prompt)}
                  className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-colors hover:border-[#E3B24B]/50 hover:text-[#F5EEDC]"
                >
                  {chip.emoji} {chip.label}
                </button>
              ))}
            </div>

            <a
              href="/how-it-works"
              className="mt-8 text-xs text-white/40 underline-offset-4 transition-colors hover:text-white/70 hover:underline"
            >
              Why our picks are different
            </a>
          </>
        )}

        {started && (
          <div className="mt-10 w-full space-y-8">
            {turns.map((turn, i) => (
              <div key={i}>
                <div className="ml-auto w-fit max-w-[85%] rounded-3xl rounded-tr-md border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-[#F5EEDC] backdrop-blur-md">
                  {turn.prompt}
                </div>

                {turn.picks === null && !turn.error && (
                  <div className="mt-4 flex gap-1.5">
                    {[0, 1, 2].map((k) => (
                      <span
                        key={k}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E3B24B]"
                        style={{ animationDelay: `${k * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}

                {turn.error && <p className="mt-4 text-sm text-red-300/90">{turn.error}</p>}

                {turn.picks && turn.picks.length === 0 && (
                  <p className="mt-4 text-sm text-white/60">
                    Nothing new matched that — try a different angle.
                  </p>
                )}

                {turn.picks && turn.picks.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {turn.picks.map((pick) => (
                      <PickCard
                        key={pick.tmdbId}
                        pick={pick}
                        onOpen={() => setDetail({ tmdbId: pick.tmdbId, mediaType: pick.mediaType })}
                        onNotForMe={() => ask("Something different, please")}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {started && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 to-transparent pb-6 pt-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(prompt);
            }}
            className="mx-auto w-full max-w-xl px-6"
          >
            <PromptBar
              value={prompt}
              onChange={setPrompt}
              onVoice={toggleVoice}
              listening={listening}
              voiceSupported={!!recognitionRef.current}
              loading={loading}
              placeholder="Tell the DJ what to change…"
            />
          </form>
        </div>
      )}

      {detail && (
        <TitleDetail
          tmdbId={detail.tmdbId}
          mediaType={detail.mediaType}
          onClose={() => setDetail(null)}
          onSwap={(tmdbId, mediaType) => setDetail({ tmdbId, mediaType })}
        />
      )}
    </div>
  );
}

function PromptBar({
  value,
  onChange,
  onVoice,
  listening,
  voiceSupported,
  loading,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onVoice: () => void;
  listening: boolean;
  voiceSupported: boolean;
  loading: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-xl transition-colors focus-within:border-[#E3B24B]/50">
      {voiceSupported && (
        <button
          type="button"
          aria-label="Voice input"
          onClick={onVoice}
          className={`grid h-10 w-10 flex-none place-items-center rounded-xl transition-colors ${
            listening ? "text-[#E3B24B]" : "text-white/50 hover:text-[#E3B24B]"
          }`}
        >
          <Mic size={18} />
        </button>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "What do you feel like watching?"}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-[#F5EEDC] placeholder:text-white/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        aria-label="Send"
        className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] text-[#181104] transition-transform hover:brightness-110 disabled:opacity-50"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}

function PickCard({
  pick,
  onOpen,
  onNotForMe,
}: {
  pick: Pick;
  onOpen: () => void;
  onNotForMe: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="flex cursor-pointer gap-4 p-4 transition-colors hover:bg-white/5"
      >
        {pick.posterPath && (
          <img
            src={`${TMDB_IMG}/w200${pick.posterPath}`}
            alt={pick.title}
            className="h-32 w-[86px] flex-none rounded-lg object-cover"
          />
        )}
        <div className="min-w-0">
          <h2 className="font-display text-xl font-medium text-[#F5EEDC]">{pick.title}</h2>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-white/50">
            {pick.year && <span>{pick.year}</span>}
            <span>{pick.mediaType}</span>
            {pick.rating && (
              <span>
                {pick.ratingSource ?? ""} ★ {pick.rating.toFixed(1)}
                {pick.voteCount ? ` · ${pick.voteCount.toLocaleString()}` : ""}
              </span>
            )}
          </div>
          {pick.streamingProviders.length > 0 && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-[#E3B24B]">
              On {pick.streamingProviders.slice(0, 2).join(" · ")}
            </p>
          )}
          {pick.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pick.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/70"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-white/75">
        {pick.why}
      </p>
      <div className="flex border-t border-white/10">
        <button
          onClick={onOpen}
          className="flex-1 border-r border-white/10 py-2.5 text-center text-xs font-medium text-[#E3B24B]/80 transition-colors hover:bg-white/5 hover:text-[#E3B24B]"
        >
          Details
        </button>
        <button
          onClick={onNotForMe}
          className="flex-1 py-2.5 text-center text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          Not for me
        </button>
      </div>
    </div>
  );
}
