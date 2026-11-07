import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { site } from "@/data/config";
import { visibleSections } from "@/data/sections";
import { useActiveSection } from "@/hooks/useActiveSection";
import { openPalette } from "@/lib/palette";

const observedIds = ["top", ...visibleSections.map((s) => s.id)];

export default function Navbar() {
  const active = useActiveSection(observedIds);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mod, setMod] = useState("Ctrl");

  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) setMod("⌘");
  }, []);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Mobile panel: focus first link, Esc to close, Tab trap, click-outside, close on desktop resize.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close(true);
      if (e.key !== "Tab" || !panel) return;
      const focusables = [buttonRef.current, ...panel.querySelectorAll<HTMLElement>("a")].filter(Boolean) as HTMLElement[];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel?.contains(t) && !buttonRef.current?.contains(t)) close();
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && close();

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onMq);
    };
  }, [open, close]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="nav" data-in="nav">
        <a href="#top" className="nav-logo">
          <span aria-hidden className="orb" />
          <span>
            {site.shortName}
            <span className="text-cyan">.</span>
          </span>
        </a>

        <nav aria-label="Primary" className="nav-menu">
          <ul>
            {visibleSections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined} className="nav-item">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-right">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open quick actions"
            aria-keyshortcuts="Control+K Meta+K"
            className="nav-pill nav-pill--glass nav-desktop js-only"
          >
            <Search className="h-4 w-4" aria-hidden />
            <kbd>{mod === "⌘" ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <a href="#contact" data-magnetic="5" className="nav-pill nav-pill--dark">
            <span className="btn__label">Get in touch</span>
          </a>
          <button
            ref={buttonRef}
            type="button"
            className="nav-pill nav-pill--glass nav-burger"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        <div ref={panelRef} id={panelId} hidden={!open} className="nav-panel">
          <nav aria-label="Mobile">
            <ul>
              {visibleSections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} onClick={() => close()} aria-current={active === s.id ? "location" : undefined}>
                    <span className="nav-panel__index">{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
