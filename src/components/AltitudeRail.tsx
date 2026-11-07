import { useEffect, useRef, useState, type CSSProperties } from "react";
import { visibleSections } from "@/data/sections";
import { scrollToId } from "@/lib/smoothScroll";

const SUMMIT = 8848; // metres — the page is a climb to Everest
const stops = [{ id: "top", label: "Launch" }, ...visibleSections.map((s) => ({ id: s.id, label: s.label }))];

/**
 * Right-edge HUD altimeter: scroll progress as altitude, one clickable mark per chapter.
 * Desktop only (CSS); decorative for screen readers except the jump buttons.
 */
export default function AltitudeRail() {
  const railRef = useRef<HTMLElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const [marks, setMarks] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let raf = 0;
    let tops: number[] = [];
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      tops = stops.map(({ id }) => {
        const el = id === "top" ? null : document.getElementById(id);
        return el ? Math.min(1, (el.getBoundingClientRect().top + window.scrollY) / max) : 0;
      });
      setMarks(tops);
    };
    const update = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      railRef.current?.style.setProperty("--p", p.toFixed(4));
      if (altRef.current) altRef.current.textContent = Math.round(p * SUMMIT).toLocaleString("en-US");
      let idx = 0;
      tops.forEach((t, i) => p + 0.02 >= t && (idx = i));
      setCurrent((c) => (c === idx ? c : idx));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    update();
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav ref={railRef} className="alt-rail js-only" aria-label="Chapters">
      <span aria-hidden className="alt-rail__title">ALT</span>
      <div className="alt-rail__track">
        <span aria-hidden className="alt-rail__fill" />
        {marks.map((t, i) => (
          <button
            key={stops[i].id}
            type="button"
            className={i === current ? "alt-rail__mark is-current" : i < current ? "alt-rail__mark is-passed" : "alt-rail__mark"}
            style={{ "--t": t } as CSSProperties}
            onClick={() => scrollToId(stops[i].id)}
            aria-label={`Go to ${stops[i].label}`}
            aria-current={i === current ? "step" : undefined}
          >
            <span className="alt-rail__label">{stops[i].label}</span>
          </button>
        ))}
        <span aria-hidden className="alt-rail__cursor">
          <span ref={altRef}>0</span> m
        </span>
      </div>
      <span aria-hidden className="alt-rail__title alt-rail__title--top">{SUMMIT.toLocaleString("en-US")}</span>
    </nav>
  );
}
