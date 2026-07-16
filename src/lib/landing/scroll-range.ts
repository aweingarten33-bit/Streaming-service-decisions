/** Maps `value` from [start, end] to a clamped [0, 1] local progress. */
export function remap(value: number, start: number, end: number): number {
  if (start === end) return value < start ? 0 : 1;
  const t = (value - start) / (end - start);
  return Math.min(1, Math.max(0, t));
}
