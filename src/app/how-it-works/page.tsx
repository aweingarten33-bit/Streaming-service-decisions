import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Kicker, Sprockets, Wordmark } from "@/components/dj/ui";

export const metadata: Metadata = {
  title: "How Watch DJ works",
  description: "Why our recommendations are different from every other streaming app.",
};

const PILLARS = [
  {
    title: "Built from real human recommendations",
    body: "Our AI is trained on thousands of movie and TV recommendations from a carefully selected network of trusted entertainment sources — people whose passion is finding genuinely great things to watch. We convert what they recommend, how strongly, and why into structured knowledge.",
  },
  {
    title: "Quality over popularity",
    body: "We don't recommend what's trending, what everyone else is watching, or what a streaming service is paying to promote. A title only surfaces if trusted sources genuinely recommended it — and we cross-check that enthusiasm against real audience ratings, so hype alone never wins.",
  },
  {
    title: "Never invented, never sponsored",
    body: "The AI never makes up a recommendation from thin air, and no one can pay to appear in your picks. Every title you see traces back to a real recommendation from our source network, matched to what you asked for.",
  },
  {
    title: "It listens like a person",
    body: 'Tell it what kind of night you\'re having — "funny but smart," "I\'ve got 90 minutes," "something my parents would also like." It narrows to a few strong picks on services you actually have, and adapts when you say "not this one."',
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      {/* Masthead */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md">
        <Sprockets />
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <Link
            href="/"
            className="focus-ink inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink transition-colors hover:text-vermilion"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <Wordmark size="sm" />
        </div>
        <hr className="rule-ink" />
      </header>

      <article className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8">
        <Kicker>The Manifesto — Ed. 01</Kicker>
        <h1 className="mt-3 text-balance font-display text-4xl font-black leading-[0.95] tracking-tight text-ink sm:text-5xl">
          Why our picks are different
        </h1>

        <p className="mt-6 max-w-xl text-pretty font-serif text-xl leading-relaxed text-ink">
          Every streaming app recommends something. Almost all of them recommend what&apos;s
          popular, what you already watched, or what they&apos;re paid to push. Watch DJ answers a
          different question:{" "}
          <span className="bg-vermilion/15 px-1 font-semibold text-ink">
            what&apos;s actually worth your night?
          </span>
        </p>

        <div className="mt-12 divide-y-[1.5px] divide-ink border-y-[1.5px] border-ink">
          {PILLARS.map((p, i) => (
            <section key={p.title} className="grid grid-cols-[auto_1fr] gap-x-5 py-7">
              <span className="font-mono text-sm font-bold text-vermilion">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-balance font-display text-2xl font-bold leading-tight text-ink">
                  {p.title}
                </h2>
                <p className="mt-3 font-serif text-[17px] leading-relaxed text-ink/80">{p.body}</p>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Quality over popularity · Curated over crowded · Discovery over scrolling
        </p>

        <Link
          href="/"
          className="focus-ink mt-8 inline-flex w-full items-center justify-center gap-2 border-[1.5px] border-ink bg-vermilion px-6 py-4 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground transition-colors hover:bg-ink hover:text-primary-foreground"
        >
          Find something to watch <ArrowRight size={16} />
        </Link>
      </article>
    </div>
  );
}
