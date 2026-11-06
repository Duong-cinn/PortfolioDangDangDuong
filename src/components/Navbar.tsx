import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/data/config";
import { visibleSections } from "@/data/sections";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";
import { OrbitMark } from "./OrbitMark";

const observedIds = ["top", ...visibleSections.map((s) => s.id)];

export default function Navbar() {
  const active = useActiveSection(observedIds);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/75 backdrop-blur-md">
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
          <a href="#top" className="group inline-flex items-center gap-2.5 rounded-md font-display text-base font-semibold">
            <OrbitMark className="h-6 w-6 text-cyan transition-transform duration-slow ease-out-expo group-hover:rotate-45" />
            <span>
              {site.shortName}
              <span className="text-cyan">.</span>
            </span>
          </a>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {visibleSections.map((s) => {
                const isActive = active === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "relative inline-flex h-10 items-center rounded-md px-3 text-sm transition-colors duration-fast",
                        isActive ? "text-ink" : "text-ink-3 hover:text-ink",
                      )}
                    >
                      {s.label}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-3 -bottom-px h-px origin-left bg-cyan transition-transform duration-base ease-out-expo",
                          isActive ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            ref={buttonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink-2 transition-colors hover:bg-elevated hover:text-ink md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        <div
          ref={panelRef}
          id={panelId}
          hidden={!open}
          className="border-t border-line bg-elevated md:hidden"
        >
          <nav aria-label="Mobile">
            <ul className="container-x flex flex-col py-3">
              {visibleSections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => close()}
                    aria-current={active === s.id ? "location" : undefined}
                    className="flex h-12 items-center gap-4 rounded-md px-2 text-base text-ink-2 hover:bg-surface hover:text-ink aria-[current=location]:text-ink"
                  >
                    <span className="font-mono text-xs text-cyan">{String(i + 1).padStart(2, "0")}</span>
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
