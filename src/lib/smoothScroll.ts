import type Lenis from "lenis";
import { warp } from "./warp";

let lenis: Lenis | null = null;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Lenis smooth scrolling (wheel/trackpad only — touch keeps native momentum).
 * Native scrollbar, keyboard and anchor behaviour stay intact. Skipped under reduced motion.
 */
export async function startSmoothScroll() {
  if (lenis || reduced()) return;
  const { default: LenisCtor } = await import("lenis");
  lenis = new LenisCtor({ lerp: 0.085, wheelMultiplier: 0.9, anchors: { offset: -16 }, autoRaf: true });
}

export function stopSmoothScroll() {
  lenis?.destroy();
  lenis = null;
}

/** Scroll to a section id ("top" = page top) and move focus there for keyboard / screen-reader users. */
export function scrollToId(id: string) {
  const el = id === "top" ? document.body : document.getElementById(id);
  if (!el) return;
  const offset = id === "top" ? 0 : -16;
  warp();
  if (lenis) lenis.scrollTo(id === "top" ? 0 : el, { offset, duration: 1.4 });
  else if (id === "top") window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
  else el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", id === "top" ? location.pathname : `#${id}`);
  const target = id === "top" ? document.getElementById("top") : el;
  if (target) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
}
