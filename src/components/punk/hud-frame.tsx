"use client";


import { cn } from '@/lib/utils'

/**
 * Technical HUD overlay — thin hairline frame inset from the edges,
 * corner tick marks, and a crosshair in the left margin.
 * Inspired by the kprverse.com technical UI. Pure decoration.
 */
export function HudFrame({
  className,
  crosshair = true,
}: {
  className?: string
  crosshair?: boolean
}) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-30', className)}
    >
      {/* inset hairline rectangle */}
      <div className="absolute inset-4 border border-ink/15 md:inset-6" />

      {/* corner ticks */}
      <Corner className="left-4 top-4 md:left-6 md:top-6" pos="tl" />
      <Corner className="right-4 top-4 md:right-6 md:top-6" pos="tr" />
      <Corner className="bottom-4 left-4 md:bottom-6 md:left-6" pos="bl" />
      <Corner className="bottom-4 right-4 md:bottom-6 md:right-6" pos="br" />

      {/* left-margin crosshair */}
      {crosshair && (
        <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 md:block">
          <div className="relative h-5 w-5">
            <span className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-ink/50" />
            <span className="absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 bg-ink/50" />
          </div>
        </div>
      )}

      {/* bottom-left dotted readout */}
      <div className="absolute bottom-6 left-6 hidden font-mono text-[10px] tracking-[0.3em] text-ink/40 md:block">
        {'· · · · ·'}
      </div>
    </div>
  )
}

function Corner({ className, pos }: { className: string; pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const h = 'absolute h-3 w-px bg-ink/50'
  const w = 'absolute h-px w-3 bg-ink/50'
  return (
    <div className={cn('absolute', className)}>
      <div className="relative h-3 w-3">
        <span className={cn(h, pos.includes('t') ? 'top-0' : 'bottom-0', pos.includes('l') ? 'left-0' : 'right-0')} />
        <span className={cn(w, pos.includes('t') ? 'top-0' : 'bottom-0', pos.includes('l') ? 'left-0' : 'right-0')} />
      </div>
    </div>
  )
}
