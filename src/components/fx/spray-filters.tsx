/** Hidden SVG filter defs, rendered once globally. `#spray-stroke` distorts
 * whatever references it (via `style={{ filter: "url(#spray-stroke)" }}`)
 * with fractal-noise displacement, so a straight border/underline reads as
 * an actual rough spray-painted stroke instead of a clean vector line. */
export function SprayFilters() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden>
      <defs>
        <filter id="spray-stroke" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" result="noise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
