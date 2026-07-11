"use client";

/** Infinite ticker — data-flavored. Pure CSS via inline keyframes. */
export function MarqueeTicker() {
  const items = [
    'EV +$412', 'ROI 18.4%', 'ENTRIES 3,204', 'TILT INDEX 0.24', 'LEAK: LATE SWAP',
    'BANKROLL DISCIPLINE 71', 'HIT RATE 22.8%', 'FORMAT: GPP', 'SPORT: NFL', 'STAKE $2,140',
  ]
  const row = [...items, ...items]
  return (
    <div className="relative overflow-hidden border-y border-[#e8e6df]/15 bg-[#08080b] py-5">
      <div className="flex gap-12 whitespace-nowrap [animation:marquee_38s_linear_infinite] hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="font-mono text-xs uppercase tracking-[0.4em] text-[#e8e6df]/75">
            <span className="mr-6 text-[#f5d100]">◆</span>
            {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  )
}