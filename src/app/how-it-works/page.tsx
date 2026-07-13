import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
    <div className="min-h-screen bg-[#08080c]">
      <div className="mx-auto w-full max-w-xl px-6 pb-20 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <ChevronLeft size={16} /> Back
        </Link>

        <h1 className="font-display mt-8 text-3xl font-semibold text-[#F5EEDC]">
          Why our picks are different
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-[#E3B24B]/80">
          Expert-curated recommendation intelligence
        </p>

        <p className="mt-6 text-[15px] leading-relaxed text-white/75">
          Every streaming app recommends something. Almost all of them recommend what&apos;s
          popular, what you already watched, or what they&apos;re paid to push. Watch DJ answers a
          different question:{" "}
          <span className="text-[#F5EEDC]">what&apos;s actually worth your night?</span>
        </p>

        <div className="mt-10 space-y-8">
          {PILLARS.map((p) => (
            <div key={p.title}>
              <h2 className="font-display text-xl text-[#F5EEDC]">{p.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">{p.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-center font-mono text-[11px] uppercase tracking-wider text-white/40">
          Quality over popularity · Curated over crowded · Discovery over scrolling
        </p>

        <Link
          href="/"
          className="mt-8 block rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] px-6 py-3 text-center font-semibold text-[#181104] transition-transform hover:brightness-110"
        >
          Find something to watch
        </Link>
      </div>
    </div>
  );
}
