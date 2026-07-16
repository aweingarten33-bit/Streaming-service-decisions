import Link from "next/link";

export function LandingNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
      <span className="font-display text-lg font-black tracking-tight text-red-ink">MARQUEE</span>
      <Link
        href="/"
        className="font-mono text-xs font-semibold tracking-[0.15em] text-red-ink/70 uppercase underline-offset-4 hover:text-red-ink hover:underline"
      >
        Open App
      </Link>
    </nav>
  );
}
