import { useEffect, useRef, useState, type CSSProperties } from "react";
import { filled, site, type Stat } from "@/data/config";
import LocalTime from "./LocalTime";

/**
 * Cockpit-style stats: each cell is an instrument with HUD corner brackets, a SYS label,
 * a count-up value and a mini visual drawn from the data (track / gauge / ladder / radar).
 * Prerendered with final values; animations start when the panel scrolls in.
 */
export default function HudStats({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDListElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLive(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // reveal lives on a wrapper: React owns this className (is-live) and would wipe `is-visible`
    <div className="reveal">
    <dl ref={ref} className={live ? "hud is-live" : "hud"}>
      {stats.map((s, i) => (
        <div key={s.label} className="hud-cell" style={{ "--d": i } as CSSProperties}>
          <dt className="hud-cell__head">
            <span>
              SYS.{String(i + 1).padStart(2, "0")} · {s.label}
            </span>
            <i aria-hidden className="hud-cell__led" />
          </dt>
          <dd className="hud-cell__body">
            <Instrument stat={s} live={live} />
          </dd>
          <span aria-hidden className="hud-cell__scan" />
        </div>
      ))}
    </dl>
    </div>
  );
}

function Instrument({ stat, live }: { stat: Stat; live: boolean }) {
  switch (stat.kind) {
    case "progress":
      return <Progress stat={stat} live={live} />;
    case "gauge":
      return <Gauge stat={stat} live={live} />;
    case "scale":
      return <Ladder stat={stat} />;
    case "location":
      return <Radar stat={stat} />;
  }
}

/** Counts from 0 to `to` once `run` turns true (keeps the final value in SSR/no-JS). */
function useCount(to: number, run: boolean, decimals = 0, from = 0) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1400);
      const e = 1 - Math.pow(1 - t, 3);
      setV(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    setV(from);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, run, from]);
  return v.toFixed(decimals);
}

function Progress({ stat, live }: { stat: Extract<Stat, { kind: "progress" }>; live: boolean }) {
  const years = Array.from({ length: stat.to - stat.from + 1 }, (_, i) => stat.from + i);
  // "now" is computed on the client only (build date ≠ visit date)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const d = new Date();
    const y = d.getFullYear() + d.getMonth() / 12;
    setNow(Math.min(1, Math.max(0, (y - stat.from) / (stat.to - stat.from))));
  }, [stat.from, stat.to]);
  const shown = useCount(Number(stat.value), live, 0, stat.from);

  return (
    <>
      <p className="hud-value">
        {shown}
        {now !== null && <span className="hud-value__unit">{Math.round(now * 100)}% done</span>}
      </p>
      <div className="hud-track" style={{ "--p": now ?? 0 } as CSSProperties}>
        <span className="hud-track__fill" />
        {years.map((y, i) => (
          <span key={y} className="hud-track__tick" style={{ left: `${(i / (years.length - 1)) * 100}%` }} />
        ))}
        {now !== null && <span className="hud-track__now" />}
      </div>
      <div className="hud-track__labels">
        <span>{stat.from}</span>
        <span>{stat.to}</span>
      </div>
      <p className="hud-caption">{stat.caption}</p>
    </>
  );
}

function Gauge({ stat, live }: { stat: Extract<Stat, { kind: "gauge" }>; live: boolean }) {
  const ratio = stat.value / stat.max;
  const shown = useCount(stat.value, live, 1);
  // 240° arc
  const R = 34;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [50 + R * Math.cos(a), 46 + R * Math.sin(a)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const start = (150 * Math.PI) / 180;
  const sweep = (240 * Math.PI) / 180;
  const ticks = Array.from({ length: stat.max * 2 + 1 }, (_, i) => start + (sweep * i) / (stat.max * 2));

  return (
    <div className="hud-gauge">
      <div>
        <p className="hud-value">
          {shown}
          <span className="hud-value__unit">/{stat.max.toFixed(1)}</span>
        </p>
        <p className="hud-caption">{stat.caption}</p>
      </div>
      <svg viewBox="0 0 100 84" aria-hidden className="hud-gauge__svg">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8d94ff" />
            <stop offset="100%" stopColor="#5fe3ff" />
          </linearGradient>
        </defs>
        <path d={arc(start, start + sweep)} className="hud-gauge__track" pathLength={1} />
        <path d={arc(start, start + sweep)} className="hud-gauge__fill" pathLength={1} style={{ "--v": ratio } as CSSProperties} />
        {ticks.map((a, i) => (
          <line
            key={i}
            x1={50 + (R - 7) * Math.cos(a)}
            y1={46 + (R - 7) * Math.sin(a)}
            x2={50 + (R - (i % 2 ? 4 : 10)) * Math.cos(a)}
            y2={46 + (R - (i % 2 ? 4 : 10)) * Math.sin(a)}
            className="hud-gauge__tick"
          />
        ))}
        <text x="50" y="50" textAnchor="middle" className="hud-gauge__pct">
          {Math.round(ratio * 100)}%
        </text>
      </svg>
    </div>
  );
}

function Ladder({ stat }: { stat: Extract<Stat, { kind: "scale" }> }) {
  const at = stat.steps.indexOf(stat.value);
  return (
    <>
      <p className="hud-value">
        {stat.value}
        <span className="hud-value__unit">CEFR</span>
      </p>
      <ol className="hud-ladder" aria-label={`${stat.value} on ${stat.steps.join(", ")}`}>
        {stat.steps.map((s, i) => (
          <li
            key={s}
            className={i === at ? "is-at" : i < at ? "is-below" : undefined}
            style={{ "--h": (i + 1) / stat.steps.length, "--j": i } as CSSProperties}
          >
            <span className="hud-ladder__bar" />
            <span className="hud-ladder__label">{s}</span>
          </li>
        ))}
      </ol>
      <p className="hud-caption">{stat.caption}</p>
    </>
  );
}

function Radar({ stat }: { stat: Extract<Stat, { kind: "location" }> }) {
  return (
    <div className="hud-radar">
      <div>
        <p className="hud-value hud-value--text">{stat.value}</p>
        <p className="hud-caption">{stat.caption}</p>
        <p className="hud-coords">
          {site.coords}
          {filled(site.timeZone) && (
            <>
              <br />
              <LocalTime timeZone={site.timeZone} />
            </>
          )}
        </p>
      </div>
      <div aria-hidden className="hud-radar__scope">
        <span className="hud-radar__sweep" />
        <span className="hud-radar__blip" />
      </div>
    </div>
  );
}
