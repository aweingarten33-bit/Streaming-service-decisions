"use client";

export function AboutScreen() {
  return (
    <div className="wall-texture relative mx-auto w-full max-w-xl px-6 pt-24 pb-12">
      <span className="font-scrawl -rotate-2 inline-block text-3xl text-red">Manifesto</span>

      <h1 className="spray-glow font-display mt-2 text-5xl leading-[0.9] tracking-tighter text-ink uppercase sm:text-6xl">
        Endless scroll
        <br />
        is death.
      </h1>

      <div className="stencil-box bg-paper-2 mt-8 p-5">
        <p className="text-[15px] leading-relaxed font-bold text-ink-2 uppercase">
          You don&apos;t need a machine guessing what you want based on what you accidentally
          watched for five minutes last Tuesday.
        </p>
      </div>

      <div className="stencil-box bg-paper-2 mt-6 p-5">
        <p className="text-[15px] leading-relaxed font-bold text-ink-2 uppercase">
          Every film, series, and documentary here was chosen by a real person.
        </p>
      </div>

      <div className="stencil-box bg-paper-2 mt-6 p-5">
        <p className="text-[15px] leading-relaxed font-bold text-ink-2 uppercase">
          We stripped away the endless rows of mediocre content designed to keep you scrolling. If
          it&apos;s here, someone believed it was worth your time. Stop browsing. Start watching.
        </p>
      </div>
    </div>
  );
}
