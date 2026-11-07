import { useEffect } from "react";
import { warp } from "@/lib/warp";

/**
 * Page-wide micro-interactions via event delegation (mount once at the app root):
 *  - [data-magnetic]  buttons lean toward the pointer, their label a bit further (depth)
 *  - .btn             click ripple from the press point
 *  - .spot            pointer spotlight (--mx / --my) on glass cards
 *  - [data-scroll]    --p = 0..1 progress of the element through the viewport (scroll-linked effects)
 * Pointer effects only for fine pointers without reduced motion; scroll progress always (static under reduce).
 */
export function useInteractions() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerFx = fine && !reduce;

    /* magnetic + spotlight */
    let magnet: HTMLElement | null = null;
    let frame = 0;
    let pending: PointerEvent | null = null;

    const release = (el: HTMLElement) => {
      el.style.removeProperty("--tx");
      el.style.removeProperty("--ty");
      el.classList.remove("is-magnet");
    };

    const apply = () => {
      frame = 0;
      const e = pending;
      if (!e) return;
      const target = e.target as HTMLElement | null;

      const m = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magnet && magnet !== m) release(magnet);
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const strength = Number(m.dataset.magnetic) || 7;
        m.style.setProperty("--tx", `${(dx * strength).toFixed(2)}px`);
        m.style.setProperty("--ty", `${(dy * strength * 0.7).toFixed(2)}px`);
        m.classList.add("is-magnet");
      }

      const spot = target?.closest<HTMLElement>(".spot");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        spot.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      }
    };

    const onMove = (e: PointerEvent) => {
      pending = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeaveDoc = () => {
      if (magnet) release(magnet);
      magnet = null;
    };

    /* in-page navigation → warp jump (skip link excluded) */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.getAttribute("href") === "#main" || a.getAttribute("href") === "#") return;
      warp();
    };
    document.addEventListener("click", onClick);

    /* click ripple */
    const onDown = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>(".btn");
      if (!btn || reduce) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const ink = document.createElement("span");
      ink.className = "btn-ripple";
      ink.style.width = ink.style.height = `${size}px`;
      ink.style.left = `${e.clientX - r.left - size / 2}px`;
      ink.style.top = `${e.clientY - r.top - size / 2}px`;
      btn.appendChild(ink);
      ink.addEventListener("animationend", () => ink.remove(), { once: true });
    };

    if (pointerFx) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeaveDoc);
    }
    document.addEventListener("pointerdown", onDown, { passive: true });

    /* scroll progress */
    let els: HTMLElement[] = [];
    let sraf = 0;
    const collect = () => (els = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]")));
    const progress = () => {
      sraf = 0;
      const h = window.innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        // 0 when the element's top enters the bottom of the viewport, 1 when its bottom reaches the top half
        const p = reduce ? 1 : Math.min(1, Math.max(0, (h - r.top) / (h * 0.5 + r.height * 0.75)));
        el.style.setProperty("--p", p.toFixed(4));
      }
    };
    const onScroll = () => {
      if (!sraf) sraf = requestAnimationFrame(progress);
    };
    collect();
    progress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (sraf) cancelAnimationFrame(sraf);
    };
  }, []);
}
