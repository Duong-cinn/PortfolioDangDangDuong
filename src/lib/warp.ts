export const WARP_EVENT = "scene:warp";

let timer = 0;

/**
 * Navigation "warp jump": the 3D scene boosts (stars streak, engines flare) and the
 * viewport edges flash briefly. No-op under reduced motion.
 */
export function warp() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.dispatchEvent(new Event(WARP_EVENT));
  const html = document.documentElement;
  html.classList.remove("is-warping");
  void html.offsetWidth; // restart the CSS flash
  html.classList.add("is-warping");
  window.clearTimeout(timer);
  timer = window.setTimeout(() => html.classList.remove("is-warping"), 900);
}
