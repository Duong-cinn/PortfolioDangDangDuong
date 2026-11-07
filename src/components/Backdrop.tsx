import { useEffect, useRef } from "react";
import { canRender3D, whenIdleAfterLoad } from "@/lib/capabilities";
import { chapterMix } from "@/lib/chapters";
import { KARST_BACK, KARST_FRONT } from "@/lib/karst";

/**
 * Fixed full-viewport scene behind the whole page (decorative, aria-hidden):
 *  1. hero layer   — deep-space dawn: indigo sky, cyan horizon glow, HUD grid
 *  2. violet layer — calm gradient for the reading sections
 *  3. night layer  — stars + a Tràng An karst skyline behind the closing section
 *  4. WebGL canvas — ship, data sea and warp stars (lazy; CSS layers are the fallback)
 * Layer opacities follow scroll (composited opacity/transform only).
 */
export default function Backdrop() {
  const heroRef = useRef<HTMLDivElement>(null);
  const violetRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // chapter crossfade
  useEffect(() => {
    let raf = 0;
    let endTop = Infinity;
    const measure = () => {
      const end = document.getElementById("contact");
      endTop = end ? end.getBoundingClientRect().top + window.scrollY : Infinity;
    };
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const h = window.innerHeight;
      const { toViolet, toNight } = chapterMix(y, h, endTop);
      if (heroRef.current) {
        heroRef.current.style.opacity = String(1 - toViolet);
        heroRef.current.style.transform = `scale(${1 + 0.08 * toViolet}) translateY(${(-0.06 * Math.min(y, 2 * h)).toFixed(1)}px)`;
      }
      if (violetRef.current) violetRef.current.style.opacity = String(toViolet * (1 - toNight));
      if (nightRef.current) nightRef.current.style.opacity = String(toNight);
      document.documentElement.classList.toggle("is-scrolled", y > 0.5 * h);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    update();
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // lazy WebGL scene
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const html = document.documentElement;
    const cancelIdle = whenIdleAfterLoad(async () => {
      if (!canRender3D() || !canvasRef.current) return;
      try {
        const [{ createSpaceScene }, { measurePoses }] = await Promise.all([import("@/three/spaceScene"), import("@/three/poses")]);
        if (cancelled || !canvasRef.current) return;
        const ctrl = createSpaceScene({
          canvas: canvasRef.current,
          measure: measurePoses,
          onReady: () => !cancelled && html.classList.add("scene-ready"),
          onFail: () => html.classList.remove("scene-ready"),
        });
        dispose = ctrl?.dispose;
      } catch {
        html.classList.remove("scene-ready");
      }
    }, 900);
    return () => {
      cancelled = true;
      cancelIdle();
      dispose?.();
      html.classList.remove("scene-ready");
    };
  }, []);

  return (
    <div aria-hidden className="scene">
      <div ref={heroRef} className="scene-layer scene-hero">
        <div className="scene-nebula" />
        <div className="scene-grid" />
      </div>
      <div ref={violetRef} className="scene-layer scene-violet" style={{ opacity: 0 }} />
      <div ref={nightRef} className="scene-layer scene-night" style={{ opacity: 0 }}>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice" className="scene-karst">
          <defs>
            <linearGradient id="karst-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8d94ff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#1a1250" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="karst-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#140e44" />
              <stop offset="100%" stopColor="#06051a" />
            </linearGradient>
          </defs>
          <path d={KARST_BACK} fill="url(#karst-back)" />
          <path d={KARST_FRONT} fill="url(#karst-front)" />
        </svg>
      </div>
      <canvas ref={canvasRef} className="scene-canvas" />
    </div>
  );
}
