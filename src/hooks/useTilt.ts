import { useEffect, type RefObject } from "react";

const MAX_DEG = 5;

/**
 * Subtle pointer tilt + glare for a card. Writes CSS variables only (no React re-render):
 * --rx / --ry (deg), --gx / --gy (glare position, %). Styles live in `.tilt` (index.css).
 * Desktop pointers only; disabled under prefers-reduced-motion.
 */
export function useTilt(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ok = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!ok.matches) return;

    let frame = 0;
    let rect: DOMRect | null = null;

    const onEnter = () => {
      rect = el.getBoundingClientRect();
      el.classList.add("is-tilting");
    };
    const onMove = (e: PointerEvent) => {
      if (!rect) rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--ry", `${((x - 0.5) * 2 * MAX_DEG).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - y) * 2 * MAX_DEG).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      rect = null;
      el.classList.remove("is-tilting");
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    // the card moves under a resting pointer while scrolling → re-measure on next move
    const onScroll = () => (rect = null);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ref]);
}
