import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Waking hours in the owner's zone — drives the status dot. */
const AWAKE_FROM = 7;
const AWAKE_TO = 23;

/**
 * Live local clock (HH:MM) for `timeZone`.
 * SSR/prerender renders a fixed-width "--:--" so hydration matches and nothing shifts;
 * the whole element is hidden without JS (`.js-only`).
 */
export default function LocalTime({ timeZone, className }: { timeZone: string; className?: string }) {
  const [now, setNow] = useState<{ text: string; iso: string; awake: boolean } | null>(null);

  useEffect(() => {
    let fmt: Intl.DateTimeFormat;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return; // unknown zone → keep placeholder (hidden by CSS below)
    }
    let timer = 0;
    const tick = () => {
      const d = new Date();
      const text = fmt.format(d);
      const hour = Number(text.slice(0, 2));
      setNow({ text, iso: d.toISOString(), awake: hour >= AWAKE_FROM && hour < AWAKE_TO });
      // re-align to the next minute boundary
      timer = window.setTimeout(tick, 60_000 - (d.getTime() % 60_000) + 50);
    };
    tick();
    const onVisible = () => document.visibilityState === "visible" && (window.clearTimeout(timer), tick());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [timeZone]);

  return (
    <span className={cn("js-only inline-flex items-center gap-2", !now && "invisible", className)}>
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-base", now?.awake ? "bg-success" : "bg-ink-3")}
      />
      <time dateTime={now?.iso} className="tabular-nums">
        {now?.text ?? "--:--"}
      </time>
      <span className="sr-only">{now ? (now.awake ? " local time, likely awake" : " local time, likely asleep") : ""}</span>
    </span>
  );
}
