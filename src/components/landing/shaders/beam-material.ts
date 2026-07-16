/**
 * Budget-volumetric projector beam: a cylinder (small radius at the lens,
 * wide at the far end) with a fresnel edge falloff + scrolling noise so it
 * reads as "dust catching fragments of light" rather than a flat cone.
 * Additive blending, no real raymarching -- keeps frame rate high.
 */
export const BEAM_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const BEAM_FRAGMENT = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 2.0);

    float n = noise(vec2(vUv.x * 6.0, vUv.y * 4.0 - uTime * 0.15));
    n += noise(vec2(vUv.x * 14.0, vUv.y * 9.0 - uTime * 0.3)) * 0.5;

    float lengthFalloff = clamp(1.0 - vUv.y, 0.0, 1.0);
    float alpha = fresnel * (0.3 + n * 0.4) * lengthFalloff * uIntensity;

    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.85));
  }
`;
