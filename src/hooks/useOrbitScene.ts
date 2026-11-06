import { useEffect, useRef, useState, type RefObject } from "react";
import { experience, has, projects, skillGroups } from "@/data/config";
import { canRender3D, whenIdleAfterLoad } from "@/lib/capabilities";
import type { OrbitController } from "@/three/orbitScene";

export type OrbitStatus = "static" | "loading" | "ready";

type Refs = {
  host: RefObject<HTMLElement>;
  canvas: RefObject<HTMLCanvasElement>;
  slot: RefObject<HTMLElement>;
  /** Layer whose opacity follows the hero scroll progress. */
  fade: RefObject<HTMLElement>;
};

/**
 * Lazy-loads the three.js hero scene after load + idle, only when the hero is on screen
 * and the device can handle it. Any failure keeps the static SVG ("static").
 */
export function useOrbitScene({ host, canvas, slot, fade }: Refs) {
  const [status, setStatus] = useState<OrbitStatus>("static");
  const [active, setActive] = useState<string | null>(null);
  const ctrl = useRef<OrbitController | null>(null);

  useEffect(() => {
    if (!canRender3D()) return;
    let cancelled = false;
    let io: IntersectionObserver | undefined;

    const load = async () => {
      setStatus("loading");
      try {
        const { createOrbitScene } = await import("@/three/orbitScene");
        if (cancelled || !host.current || !canvas.current || !slot.current) return;
        ctrl.current = createOrbitScene({
          canvas: canvas.current,
          host: host.current,
          slot: slot.current,
          groups: skillGroups.map((g) => ({ id: g.id, tone: g.tone, count: g.items.length, clickable: has(g.items) })),
          satellites: Math.min(projects.length, 5),
          comet: has(experience),
          onReady: () => !cancelled && setStatus("ready"),
          onFail: () => {
            ctrl.current = null;
            if (!cancelled) setStatus("static");
          },
          onHover: (id) => !cancelled && setActive(id),
          onSelect: (id) => {
            window.location.hash = `skill-${id}`;
          },
        });
      } catch {
        if (!cancelled) setStatus("static");
      }
    };

    const cancelIdle = whenIdleAfterLoad(() => {
      const el = host.current;
      if (!el) return;
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          io?.disconnect();
          load();
        }
      });
      io.observe(el);
    });

    return () => {
      cancelled = true;
      cancelIdle();
      io?.disconnect();
      ctrl.current?.dispose();
      ctrl.current = null;
    };
  }, [host, canvas, slot]);

  // DOM chips → scene
  useEffect(() => {
    ctrl.current?.setActive(active);
  }, [active]);

  // Scroll progress of the hero → object rotate/scale + canvas fade (no React re-render).
  useEffect(() => {
    if (status !== "ready") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = host.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      ctrl.current?.setScroll(p);
      if (fade.current) {
        const k = Math.min(1, p / 0.6);
        fade.current.style.opacity = String(1 - k * k * (3 - 2 * k));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [status, host, fade]);

  return { status, active, setActive };
}
