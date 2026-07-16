/**
 * Burning tire-track strip. `uEra` (0..5, continuous) blends through six
 * hand-authored colors standing in for silent / sepia / Technicolor / VHS /
 * digital / abstract-future cinema -- the "journey through eras" lives in
 * this material, not a separate tunnel or slideshow.
 */
export const TRACK_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const TRACK_FRAGMENT = `
  uniform float uEra;
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  vec3 eraColor(float era) {
    vec3 c0 = vec3(0.82, 0.82, 0.82);
    vec3 c1 = vec3(0.95, 0.58, 0.22);
    vec3 c2 = vec3(1.0, 0.14, 0.08);
    vec3 c3 = vec3(0.55, 0.92, 0.98);
    vec3 c4 = vec3(1.0, 1.0, 1.0);
    vec3 c5 = vec3(0.82, 0.42, 1.0);

    vec3 col = c0;
    col = mix(col, c1, smoothstep(0.0, 1.0, era));
    col = mix(col, c2, smoothstep(1.0, 2.0, era));
    col = mix(col, c3, smoothstep(2.0, 3.0, era));
    col = mix(col, c4, smoothstep(3.0, 4.0, era));
    col = mix(col, c5, smoothstep(4.0, 5.0, era));
    return col;
  }

  void main() {
    vec3 color = eraColor(uEra);
    float flicker = 0.8 + 0.2 * noise(vec2(vUv.x * 20.0, uTime * 4.0));
    float edgeFade = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
    // fade toward the far end (high vUv.y) -- smoothstep requires edge0 < edge1,
    // so ascend then invert rather than passing (1.0, 0.55) directly (that
    // produced alpha = 0 unconditionally on this GPU/driver).
    float lengthFade = 1.0 - smoothstep(0.55, 1.0, vUv.y);
    float alpha = edgeFade * lengthFade * flicker * uIntensity;
    gl_FragColor = vec4(color * 1.6, clamp(alpha, 0.0, 1.0));
  }
`;
