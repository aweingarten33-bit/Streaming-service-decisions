/** A decorative silhouette: someone on a couch watching TV -- same simple
 * flat-shape, one-red-accent illustration style as the reference's rat and
 * balloon-girl motifs, but on-brand for a movie/TV app instead of borrowed
 * Banksy iconography. */
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
      <rect x="8" y="20" width="70" height="46" rx="2" fill={fill} />
      <rect x="16" y="28" width="54" height="30" fill="#e3170a" opacity="0.15" />
      <rect x="36" y="66" width="14" height="8" fill={fill} />
      <rect x="26" y="74" width="34" height="4" fill={fill} />

      {/* couch */}
      <rect x="95" y="70" width="120" height="14" rx="4" fill={fill} />
      <rect x="95" y="50" width="16" height="48" rx="6" fill={fill} />
      <rect x="199" y="50" width="16" height="48" rx="6" fill={fill} />
      <rect x="105" y="58" width="100" height="30" rx="6" fill={fill} />

      {/* person sitting, slouched, feet up */}
      <circle cx="150" cy="42" r="12" fill={fill} />
      <path d="M138,54 Q150,50 165,56 L168,78 L134,78 Z" fill={fill} />
      <rect x="168" y="66" width="26" height="9" rx="4" fill={fill} />
      <rect x="128" y="78" width="12" height="20" rx="4" fill={fill} transform="rotate(6 128 78)" />
      <rect
        x="152"
        y="80"
        width="12"
        height="20"
        rx="4"
        fill={fill}
        transform="rotate(-4 152 80)"
      />
    </svg>
  );
}
