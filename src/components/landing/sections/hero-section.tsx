"use client";

export function HeroSection() {
  return (
    <section className="relative flex h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-ink/20" />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="animate-in fade-in slide-in-from-bottom-4 font-display max-w-2xl text-4xl leading-tight font-black tracking-tight text-red-ink duration-700 sm:text-6xl md:text-7xl">
          EVERY GREAT STORY
          <br />
          BEGINS WITH LIGHT
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-4 mt-5 max-w-lg text-base text-red-ink/70 duration-700 delay-150 sm:text-lg">
          A journey through the moments, objects, and impossible worlds that make movies
          unforgettable.
        </p>
      </div>
    </section>
  );
}
