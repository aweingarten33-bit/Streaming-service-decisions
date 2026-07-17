/** A decorative silhouette: someone sitting in an armchair watching TV --
 * same simple flat-shape, one-red-accent illustration style as the
 * reference's rat and balloon-girl motifs, but on-brand for a movie/TV app
 * instead of borrowed Banksy iconography. Composition (TV beside a single
 * armchair, person sitting normally, one leg visible past the seat edge)
 * based on a "COUCHSURFER" stencil mural reference. */
export function CouchWatcher({
  className = "",
  fill = "currentColor",
  size = 200,
}: {
  className?: string;
  fill?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 220 140"
      width={size}
      className={className}
      style={{ filter: "drop-shadow(2px 2px 6px rgb(0 0 0 / 25%))" }}
      aria-hidden
    >
      {/* TV */}
      <rect x="8" y="18" width="70" height="48" rx="2" fill={fill} />
      <rect x="16" y="26" width="54" height="32" fill="#e3170a" opacity="0.2" />
      <rect x="36" y="66" width="14" height="10" fill={fill} />
      <rect x="24" y="76" width="38" height="5" fill={fill} />

      {/* chair */}
      <rect x="110" y="45" width="70" height="40" rx="10" fill={fill} />
      <rect x="95" y="60" width="18" height="35" rx="8" fill={fill} />
      <rect x="185" y="60" width="18" height="35" rx="8" fill={fill} />
      <rect x="100" y="80" width="100" height="16" rx="7" fill={fill} />

      {/* person */}
      <circle cx="150" cy="40" r="12" fill={fill} />
      <rect x="136" y="50" width="30" height="30" rx="10" fill={fill} />
      <rect x="122" y="62" width="16" height="10" rx="5" fill={fill} />

      {/* legs, bent, one foot visible past the seat edge */}
      <rect x="118" y="82" width="34" height="13" rx="6" fill={fill} />
      <rect
        x="112"
        y="90"
        width="13"
        height="24"
        rx="6"
        fill={fill}
        transform="rotate(-4 112 90)"
      />
      <rect x="104" y="112" width="18" height="7" rx="3" fill={fill} />
    </svg>
  );
}
