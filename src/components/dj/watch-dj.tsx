"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  ArrowUp,
  Sparkles,
  Zap,
  Laugh,
  Tv,
  Clapperboard,
  Shuffle,
  Bookmark,
  BookmarkCheck,
  Plus,
} from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { useWatchlist } from "@/lib/watchlist";
import { TitleDetail } from "./title-detail";
import { WatchlistDrawer } from "./watchlist-drawer";
import { CueingDots, Kicker, MetaLine, PosterFrame, Sprockets, Stamp, TMDB_IMG, Wordmark } from "./ui";

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
  { Icon: Sparkles, label: "Hidden gems", prompt: "Show me a hidden gem nobody talks about" },
  { Icon: Zap, label: "Mind-bending", prompt: "I want something mind-bending" },
  { Icon: Laugh, label: "Funny tonight", prompt: "I need something funny tonight" },
  { Icon: Tv, label: "One-season series", prompt: "A great one-season series with a complete story" },
  { Icon: Clapperboard, label: "Documentary", prompt: "An unbelievable documentary" },
  { Icon: Shuffle, label: "Surprise me", prompt: "I don't know what I want, surprise me" },
];

const CURATORS_TICKER = [
  "Trusted human curators",
  "No popularity contests",
  "Never sponsored",
  "Cross-referenced sources",
  "A few great picks, not a feed",
];

export function WatchDj({ backdrops }: { backdrops: string[] }) {
  const [bgIndex, setBgIndex] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  // Navigation stack so hopping through More Like This can step back page by page.
  const [detailStack, setDetailStack] = useState<{ tmdbId: number; mediaType: string }[]>([]);
  const shownIds = useRef<number[]>([]);
  const lastFilters = useRef<ParsedFilters | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { items: watchlist } = useWatchlist();

  useEffect(() => {
    if (backdrops.length < 2) return;
    const id = setInterval(() => setBgIndex((i) => (i + 1) % backdrops.length), 6000);
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
  const openDetail = (tmdbId: number, mediaType: string) =>
    setDetailStack([{ tmdbId, mediaType }]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Masthead */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md">
        <Sprockets />
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <Wordmark size="sm" />
            <Kicker className="hidden sm:inline">{started ? "The Session" : "Now Showing"}</Kicker>
          </div>
          <button
            type="button"
            onClick={() => setWatchlistOpen(true)}
            className="focus-ink inline-flex items-center gap-1.5 border-[1.5px] border-ink px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-primary-foreground"
            aria-label={`Open watchlist, ${watchlist.length} saved`}
          >
            <Bookmark size={13} />
            List
            <span className="ml-0.5 inline-grid min-w-[16px] place-items-center bg-vermilion px-1 text-primary-foreground">
              {watchlist.length}
            </span>
          </button>
        </div>
        <hr className="rule-ink" />
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 pb-44 pt-6">
        {!started && (
          <Hero
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={() => ask(prompt)}
            onVoice={toggleVoice}
            listening={listening}
            voiceSupported={!!recognitionRef.current}
            loading={loading}
            onChip={ask}
            backdrops={backdrops}
            bgIndex={bgIndex}
          />
        )}

        {started && (
          <div className="space-y-10">
            {turns.map((turn, i) => (
              <div key={i} className="stagger-in">
                {/* Request slip */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] border-[1.5px] border-ink bg-ink px-4 py-2.5 text-primary-foreground">
                    <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground/60">
                      Your request
                    </span>
                    <p className="font-serif text-[15px] italic leading-snug">{turn.prompt}</p>
                  </div>
                </div>

                {turn.picks === null && !turn.error && (
                  <div className="mt-6">
                    <CueingDots label="The DJ is digging through the crates" />
                  </div>
                )}

                {turn.error && (
                  <div className="mt-6 border-[1.5px] border-destructive bg-destructive/5 px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-destructive">
                      Needle skipped
                    </p>
                    <p className="mt-1 font-serif text-sm text-ink">{turn.error}</p>
                  </div>
                )}

                {turn.picks && turn.picks.length === 0 && (
                  <div className="mt-6 border-[1.5px] border-dashed border-ink/40 px-4 py-5 text-center">
                    <p className="font-serif italic text-muted-foreground">
                      Nothing new matched that. Try a different angle.
                    </p>
                  </div>
                )}

                {turn.picks && turn.picks.length > 0 && (
                  <div className="mt-6">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="kicker text-vermilion">The DJ spins</span>
                      <hr className="rule-hair flex-1" />
                      <Kicker>
                        {String(turn.picks.length).padStart(2, "0")}{" "}
                        {turn.picks.length === 1 ? "pick" : "picks"}
                      </Kicker>
                    </div>
                    <div className="space-y-6">
                      {turn.picks.map((pick, idx) => (
                        <PickCard
                          key={pick.tmdbId}
                          index={idx}
                          pick={pick}
                          onOpen={() => openDetail(pick.tmdbId, pick.mediaType)}
                          onNotForMe={() => ask("Something different, please")}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Docked prompt bar once a session has started */}
      {started && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-background/92 backdrop-blur-md">
          <hr className="rule-ink" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(prompt);
            }}
            className="mx-auto w-full max-w-2xl px-5 py-4"
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

      {watchlistOpen && (
        <WatchlistDrawer
          onClose={() => setWatchlistOpen(false)}
          onOpenTitle={(tmdbId, mediaType) => {
            setWatchlistOpen(false);
            openDetail(tmdbId, mediaType);
          }}
        />
      )}

      {detailStack.length > 0 && (
        <TitleDetail
          tmdbId={detailStack[detailStack.length - 1].tmdbId}
          mediaType={detailStack[detailStack.length - 1].mediaType}
          onClose={() => setDetailStack((s) => s.slice(0, -1))}
          onSwap={(tmdbId, mediaType) => setDetailStack((s) => [...s, { tmdbId, mediaType }])}
        />
      )}
    </div>
  );
}

function Hero({
  prompt,
  setPrompt,
  onSubmit,
  onVoice,
  listening,
  voiceSupported,
  loading,
  onChip,
  backdrops,
  bgIndex,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  onSubmit: () => void;
  onVoice: () => void;
  listening: boolean;
  voiceSupported: boolean;
  loading: boolean;
  onChip: (prompt: string) => void;
  backdrops: string[];
  bgIndex: number;
}) {
  return (
    <div className="rise-in">
      <div className="flex items-center gap-3">
        <Kicker>Vol. 01</Kicker>
        <hr className="rule-hair flex-1" />
        <Kicker>Est. tonight</Kicker>
      </div>

      <h1 className="mt-5 text-balance font-display text-[2.5rem] font-black leading-[0.95] tracking-tight text-ink sm:text-6xl">
        Tell the DJ what kind of night you&apos;re having.
      </h1>
      <p className="mt-4 max-w-md text-pretty font-serif text-lg leading-relaxed text-muted-foreground">
        A few genuinely great films &amp; shows, hand-picked from trusted human curators.{" "}
        <span className="text-ink">Never popularity. Never sponsored.</span>
      </p>

      {/* Rotating framed still — a printed "from the vault" flourish */}
      {backdrops.length > 0 && (
        <div className="group relative mt-7 overflow-hidden frame-ink bg-secondary">
          <div className="aspect-[16/7] w-full">
            {backdrops.map((path, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={path}
                src={`${TMDB_IMG}/w780${path}`}
                alt=""
                aria-hidden
                className="img-vermilion absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms]"
                style={{ opacity: i === bgIndex ? 1 : 0 }}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between bg-ink/85 px-3 py-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground/80">
              From the vault
            </span>
            <Stamp>Reel 35mm</Stamp>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-7"
      >
        <PromptBar
          value={prompt}
          onChange={setPrompt}
          onVoice={onVoice}
          listening={listening}
          voiceSupported={voiceSupported}
          loading={loading}
        />
      </form>

      <div className="mt-5">
        <Kicker>Or cue a mood</Kicker>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map(({ Icon, label, prompt: p }) => (
            <button
              key={label}
              onClick={() => onChip(p)}
              className="focus-ink group inline-flex items-center gap-2 border-[1.5px] border-ink/25 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/75 transition-colors hover:border-ink hover:bg-ink hover:text-primary-foreground"
            >
              <Icon size={14} className="text-vermilion group-hover:text-primary-foreground" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Curator ticker */}
      <div className="relative mt-9 overflow-hidden border-y-[1.5px] border-ink py-2.5">
        <div className="marquee-track flex w-max items-center gap-6 whitespace-nowrap">
          {[...CURATORS_TICKER, ...CURATORS_TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t}
              <span className="text-vermilion" aria-hidden>
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>

      <a
        href="/how-it-works"
        className="link-sweep mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.15em] text-ink"
      >
        Why our picks are different →
      </a>
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
    <div className="flex items-center gap-2 border-[1.5px] border-ink bg-card px-2 py-1.5 transition-shadow focus-within:shadow-ink-sm">
      {voiceSupported && (
        <button
          type="button"
          aria-label={listening ? "Stop listening" : "Voice input"}
          onClick={onVoice}
          className={`grid h-11 w-11 flex-none place-items-center transition-colors ${
            listening ? "bg-vermilion text-accent-foreground" : "text-muted-foreground hover:text-ink"
          }`}
        >
          <Mic size={18} />
        </button>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "What do you feel like watching?"}
        className="min-w-0 flex-1 bg-transparent py-2.5 font-serif text-base text-ink placeholder:text-muted-foreground/70 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        aria-label="Send to the DJ"
        className="grid h-11 w-11 flex-none place-items-center border-[1.5px] border-ink bg-ink text-primary-foreground transition-colors hover:bg-vermilion hover:border-vermilion disabled:opacity-50"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}

function PickCard({
  pick,
  index,
  onOpen,
  onNotForMe,
}: {
  pick: Pick;
  index: number;
  onOpen: () => void;
  onNotForMe: () => void;
}) {
  const { has, toggle } = useWatchlist();
  const saved = has(pick.tmdbId);

  return (
    <article className="group relative border-[1.5px] border-ink bg-card transition-shadow hover:shadow-ink">
      <div className="flex gap-4 p-4">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${pick.title}`}
          className="focus-ink relative w-[92px] flex-none self-start"
        >
          <PosterFrame src={pick.posterPath ? `${TMDB_IMG}/w300${pick.posterPath}` : null} alt={pick.title} />
          <span className="absolute -left-1.5 -top-2 bg-vermilion px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            className="focus-ink block text-left"
          >
            <h2 className="text-balance font-display text-xl font-bold leading-tight text-ink group-hover:text-vermilion">
              {pick.title}
            </h2>
          </button>
          <MetaLine
            className="mt-1.5"
            items={[
              pick.year ? String(pick.year) : null,
              pick.mediaType,
              pick.rating
                ? `${pick.ratingSource ?? ""} ${pick.rating.toFixed(1)}${
                    pick.voteCount ? ` · ${pick.voteCount.toLocaleString()}` : ""
                  }`.trim()
                : null,
            ]}
          />

          {pick.streamingProviders.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                On
              </span>
              {pick.streamingProviders.slice(0, 2).map((p) => (
                <Stamp key={p}>{p}</Stamp>
              ))}
            </div>
          )}

          {pick.genres.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {pick.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="border border-ink/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/70"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Why this — editorial pull quote */}
      <div className="mx-4 mb-4 border-l-2 border-vermilion bg-secondary/60 px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vermilion">Why this</p>
        <p className="mt-1.5 font-serif text-[15px] leading-relaxed text-ink">{pick.why}</p>
      </div>

      {/* Actions */}
      <div className="flex border-t-[1.5px] border-ink">
        <button
          onClick={onOpen}
          className="focus-ink flex-1 border-r-[1.5px] border-ink py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:bg-ink hover:text-primary-foreground"
        >
          The program
        </button>
        <button
          onClick={() =>
            toggle({
              tmdbId: pick.tmdbId,
              title: pick.title,
              year: pick.year,
              mediaType: pick.mediaType,
              posterPath: pick.posterPath,
            })
          }
          aria-pressed={saved}
          className={`focus-ink flex flex-1 items-center justify-center gap-1.5 border-r-[1.5px] border-ink py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
            saved
              ? "bg-vermilion text-accent-foreground"
              : "text-ink hover:bg-secondary"
          }`}
        >
          {saved ? <BookmarkCheck size={13} /> : <Plus size={13} />}
          {saved ? "On the list" : "Add"}
        </button>
        <button
          onClick={onNotForMe}
          className="focus-ink flex-1 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
        >
          Not for me
        </button>
      </div>
    </article>
  );
}
