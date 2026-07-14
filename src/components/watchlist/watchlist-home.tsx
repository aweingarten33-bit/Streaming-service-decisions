"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, ArrowUp, ListVideo } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { MyList } from "./my-list";

const TMDB_IMG = "https://image.tmdb.org/t/p";

interface Match {
  tmdbId: number;
  title: string;
  mediaType: string;
  year: number | null;
  posterPath: string | null;
  reason: string;
}

interface Turn {
  prompt: string;
  matches: Match[] | null;
  error: string | null;
}

export function WatchlistHome() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [showList, setShowList] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    setTurns((t) => [...t, { prompt: text, matches: null, error: null }]);
    setPrompt("");

    try {
      const res = await fetch("/api/watchlist/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, deviceId: getDeviceId() }),
      });
      const data = await res.json();
      if (data.error) {
        setTurns((t) => {
          const next = [...t];
          next[turnIndex] = { prompt: text, matches: null, error: data.error };
          return next;
        });
        return;
      }
      setTurns((t) => {
        const next = [...t];
        next[turnIndex] = { prompt: text, matches: data.results ?? [], error: null };
        return next;
      });
    } catch {
      setTurns((t) => {
        const next = [...t];
        next[turnIndex] = { prompt: text, matches: null, error: "Something went wrong." };
        return next;
      });
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  const started = turns.length > 0;

  return (
    <div className="relative min-h-screen bg-[#08080c]">
      <button
        onClick={() => setShowList(true)}
        className="fixed right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition-colors hover:border-[#E3B24B]/50 hover:text-[#F5EEDC]"
      >
        <ListVideo size={14} /> My List
      </button>

      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-6 pb-40 pt-24">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[#F5EEDC] sm:text-5xl">
          What are you in the mood for?
        </h1>
        <p className="mt-3 text-center text-base text-white/50">
          I'll pick something from your own list.
        </p>

        {!started && (
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
        )}

        {started && (
          <div className="mt-10 w-full space-y-8">
            {turns.map((turn, i) => (
              <div key={i}>
                <div className="ml-auto w-fit max-w-[85%] rounded-3xl rounded-tr-md border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-[#F5EEDC] backdrop-blur-md">
                  {turn.prompt}
                </div>

                {turn.matches === null && !turn.error && (
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

                {turn.error && (
                  <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
                    {turn.error}
                  </div>
                )}

                {turn.matches && turn.matches.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {turn.matches.map((m) => (
                      <div
                        key={m.tmdbId}
                        className="flex gap-3 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl"
                      >
                        {m.posterPath ? (
                          <img
                            src={`${TMDB_IMG}/w200${m.posterPath}`}
                            alt={m.title}
                            className="h-28 w-[76px] flex-none rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-28 w-[76px] flex-none rounded-lg bg-white/10" />
                        )}
                        <div className="min-w-0">
                          <h2 className="font-display text-lg font-medium text-[#F5EEDC]">
                            {m.title}
                          </h2>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                            {m.year} · {m.mediaType}
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-white/75">{m.reason}</p>
                        </div>
                      </div>
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
              placeholder="Ask again..."
            />
          </form>
        </div>
      )}

      {showList && <MyList onClose={() => setShowList(false)} />}
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
        placeholder={placeholder ?? "cozy movie, dark thriller under 2 hours, I'm feeling lazy..."}
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
