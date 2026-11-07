/** smoothstep(a, b, v) with t clamped to 0..1 */
export const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Backdrop chapters, shared by the CSS layers and the WebGL scene:
 * hero (deep-space dawn) → violet (middle sections) → night (closing section).
 */
export function chapterMix(scrollY: number, viewportH: number, endTop: number) {
  const h = viewportH;
  const toViolet = smoothstep(0.15 * h, 1.05 * h, scrollY);
  const toNight = Number.isFinite(endTop) ? smoothstep(endTop - 1.1 * h, endTop - 0.1 * h, scrollY) : 0;
  return { toViolet, toNight };
}
