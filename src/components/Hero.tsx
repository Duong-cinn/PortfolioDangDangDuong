import { useEffect, useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import { filled, projects, site, skillGroups } from "@/data/config";
import { scrollToId } from "@/lib/smoothScroll";
import LocalTime from "./LocalTime";
import { BtnLink, Chip } from "./ui/Btn";

const EASE = "cubic-bezier(.2,.75,.2,1)";

/** One Web Animations timeline, run once on load (see index.css `[data-in]` guard). */
const ENTRANCE: [selector: string, from: Keyframe, delay: number, duration: number][] = [
  ['[data-in="nav"]', { opacity: 0, transform: "translateY(-14px)" }, 0, 900],
  ['[data-in="meta"]', { opacity: 0, transform: "translateY(10px)" }, 150, 900],
  ['[data-in="line1"]', { opacity: 0, transform: "translateY(105%)" }, 250, 1100],
  ['[data-in="line2"]', { opacity: 0, transform: "translateY(105%)" }, 370, 1100],
  ['[data-in="sub"]', { opacity: 0, transform: "translateY(12px)" }, 620, 900],
  ['[data-in="cta"]', { opacity: 0, transform: "translateY(14px)" }, 740, 900],
  ['[data-in="card"]', { opacity: 0, transform: "translateY(40px) scale(.96)" }, 880, 1100],
  ['[data-in="hud"]', { opacity: 0, transform: "translateX(16px)" }, 980, 1000],
];

export default function Hero() {
  useEffect(() => {
    const html = document.documentElement;
    const done = () => (html.dataset.entered = "1");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof Element.prototype.animate !== "function") {
      done();
      return;
    }
    for (const [sel, from, delay, duration] of ENTRANCE) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) =>
        el.animate([from, { opacity: 1, transform: "none" }], { duration, delay, easing: EASE, fill: "backwards" }),
      );
    }
    const raf = requestAnimationFrame(done);
    const failsafe = window.setTimeout(done, 3000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
    };
  }, []);

  const skillCount = skillGroups.reduce((n, g) => n + g.items.length, 0);
  const [first, ...rest] = site.name.split(" ");
  // "Đặng Đăng" / "Dương": last word on its own line
  const line1 = [first, ...rest.slice(0, -1)].join(" ");
  const line2 = rest.at(-1) ?? "";

  return (
    <section id="top" aria-labelledby="hero-title" className="hero">
      <p className="hero-meta" data-in="meta">
        <span className="text-cyan">{site.coords}</span>
        <span aria-hidden className="hero-meta__rule" />
        <span>
          {site.location} · {site.timezone}
        </span>
        {filled(site.timeZone) && (
          <>
            <span aria-hidden className="hero-meta__rule js-only" />
            <LocalTime timeZone={site.timeZone} />
          </>
        )}
      </p>

      <h1 id="hero-title" className="hero-title">
        <span className="hero-title__mask">
          <span data-in="line1">{line1}</span>
        </span>
        {line2 && (
          <span className="hero-title__mask">
            <span data-in="line2">
              {line2}
              <span className="text-cyan">.</span>
            </span>
          </span>
        )}
      </h1>

      <div className="hero-sub" data-in="sub">
        <p className="hero-sub__role">
          {site.role}
          <span className="hero-sub__focus"> — {site.focus}</span>
        </p>
        {filled(site.availability) && (
          <Chip live className="hero-sub__chip">
            {site.availability}
          </Chip>
        )}
      </div>

      <div className="hero-cta" data-in="cta">
        <BtnLink href="#contact">Get in touch</BtnLink>
        <BtnLink href="#projects" variant="ghost">
          See my work
        </BtnLink>
        {filled(site.cvUrl) && (
          <BtnLink href={site.cvUrl} variant="ghost" download>
            <ArrowDownToLine className="h-4 w-4" aria-hidden /> CV
          </BtnLink>
        )}
      </div>

      <dl className="hero-hud" data-in="hud" aria-label="At a glance">
        <div>
          <dt>skills</dt>
          <dd>{String(skillCount).padStart(2, "0")}</dd>
        </div>
        <div>
          <dt>orbits</dt>
          <dd>{String(skillGroups.length).padStart(2, "0")}</dd>
        </div>
        <div>
          <dt>projects</dt>
          <dd>{String(projects.length).padStart(2, "0")}</dd>
        </div>
        <div>
          <dt>status</dt>
          <dd className="text-mint">learning</dd>
        </div>
      </dl>

      <LaunchPanel />
    </section>
  );
}

const COUNT = ["03", "02", "01", "GO"] as const;
const CHECKS = ["ENGINES", "NAV LOCK", "CREW"] as const;

/**
 * Hero → About trigger styled as a pre-launch console: hazard stripe, T-minus countdown,
 * system checks ticking to OK, a charge bar and a glitching call to action.
 * Click = warp jump to About. Decorative parts are aria-hidden; the button has a plain label.
 */
function LaunchPanel() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(COUNT.length - 1);
      return;
    }
    let i = 0;
    let timer = 0;
    const tick = () => {
      i = (i + 1) % (COUNT.length + 1); // one extra beat holding "GO"
      setStep(Math.min(i, COUNT.length - 1));
      timer = window.setTimeout(tick, i === COUNT.length ? 1600 : 1000);
    };
    timer = window.setTimeout(tick, 1800); // after the hero entrance
    return () => window.clearTimeout(timer);
  }, []);

  const go = COUNT[step] === "GO";

  return (
    <button
      type="button"
      className={go ? "launch is-go" : "launch"}
      data-in="card"
      onClick={() => scrollToId("about")}
      aria-label="Scroll down and discover"
    >
      <span aria-hidden className="launch__frame">
        <span className="launch__stripe" />
        <span className="launch__head">
          <span className="launch__title">
            <i className="launch__led" />◢ LAUNCH SEQ
          </span>
          <span>DO-01</span>
        </span>
        <span className="launch__count">
          {go ? "" : "T-"}
          <b key={step}>{COUNT[step]}</b>
        </span>
        <span className="launch__checks">
          {CHECKS.map((c, i) => (
            <span key={c} className={step >= i || go ? "is-ok" : undefined}>
              {c}
              <i>{step >= i || go ? "OK" : "··"}</i>
            </span>
          ))}
        </span>
        <span className="launch__bar">
          <span style={{ width: `${((step + 1) / COUNT.length) * 100}%` }} />
        </span>
        <span className="launch__cta" data-text="SCROLL TO LAUNCH ↓">
          SCROLL TO LAUNCH ↓
        </span>
      </span>
    </button>
  );
}
