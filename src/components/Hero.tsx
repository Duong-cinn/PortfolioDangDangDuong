import { useRef, type CSSProperties } from "react";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { filled, has, site, skillGroups } from "@/data/config";
import { useOrbitScene } from "@/hooks/useOrbitScene";
import { toneClass } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ui/Button";
import OrbitFallback from "./hero/OrbitFallback";
import LocalTime from "./LocalTime";

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Hero() {
  const hostRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const { status, active, setActive } = useOrbitScene({ host: hostRef, canvas: canvasRef, slot: slotRef, fade: fadeRef });
  const live = status === "ready";

  return (
    <section ref={hostRef} id="top" aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Full-bleed WebGL layer (object + ambient particles). Decorative: the chips below carry the same info. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-slow ease-out",
          live ? "opacity-100" : "opacity-0",
        )}
      >
        <div ref={fadeRef} className="h-full w-full">
          {status !== "static" && <canvas ref={canvasRef} className="block h-full w-full" />}
        </div>
      </div>

      <div className="container-x relative z-10 grid min-h-[min(calc(100svh-var(--header-h)),880px)] items-center gap-12 pb-20 pt-12 md:grid-cols-8 md:pt-16 lg:grid-cols-12 lg:gap-8">
        {/* Text — always the dominant layer */}
        <div className="md:col-span-5 lg:col-span-7">
          <p className="hero-in label-mono flex flex-wrap items-center gap-x-3 gap-y-1" style={stagger(0)}>
            <span className="group relative cursor-default text-cyan">
              {site.coords}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded-md border border-line bg-elevated px-2.5 py-1 normal-case tracking-normal text-ink-2 opacity-0 transition-opacity duration-fast group-hover:opacity-100"
              >
                Tràng An karst · Ninh Bình
              </span>
            </span>
            <span aria-hidden className="hidden h-px w-6 bg-line sm:block" />
            <span>
              {site.location} · {site.timezone}
            </span>
            {filled(site.timeZone) && (
              <>
                <span aria-hidden className="js-only hidden h-px w-6 bg-line sm:block" />
                <LocalTime timeZone={site.timeZone} />
              </>
            )}
          </p>

          {/* h1 is intentionally NOT a .reveal — it is the LCP element and must paint immediately. */}
          <h1 id="hero-title" className="mt-6 text-display">
            {site.name}
          </h1>

          <p className="hero-in mt-5 font-display text-h3 font-medium text-ink-2" style={stagger(1)}>
            {site.role}
            <span className="text-cyan">.</span>
          </p>

          {filled(site.focus) && (
            <p className="hero-in mt-2 text-sm text-ink-3" style={stagger(2)}>
              {site.focus}
            </p>
          )}

          {filled(site.tagline) && (
            <p className="hero-in mt-6 max-w-prose text-ink-2" style={stagger(3)}>
              {site.tagline}
            </p>
          )}

          {filled(site.availability) && (
            <p
              className="hero-in mt-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-sm text-ink-2"
              style={stagger(3)}
            >
              <span aria-hidden className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
                <span className="relative h-2 w-2 rounded-full bg-success" />
              </span>
              {site.availability}
            </p>
          )}

          <div className="hero-in mt-8 flex flex-wrap gap-3" style={stagger(4)}>
            <ButtonLink href="#contact">
              Get in touch
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            {filled(site.cvUrl) && (
              <ButtonLink href={site.cvUrl} variant="secondary" download>
                <ArrowDownToLine className="h-4 w-4" aria-hidden />
                Download CV
              </ButtonLink>
            )}
          </div>
        </div>

        {/* Object slot — the 3D object is fitted to this box, the SVG fills it until then. */}
        <div className="md:col-span-3 lg:col-span-5">
          <div ref={slotRef} className="relative mx-auto aspect-square w-[min(78vw,320px)] md:w-full md:max-w-[420px] lg:max-w-[540px]">
            <OrbitFallback
              active={active}
              className={cn("transition-opacity duration-slow ease-out", live ? "opacity-0" : "opacity-100")}
            />
          </div>

          <ul aria-label="Skill orbits" className="mt-6 flex flex-wrap justify-center gap-2">
            {skillGroups.map((g) => {
              const isActive = active === g.id;
              const interactive = has(g.items);
              const chipClass = cn(
                "inline-flex h-8 items-center gap-2 rounded-full border px-3 font-mono text-xs transition-colors duration-fast",
                isActive ? cn("bg-elevated text-ink", toneClass[g.tone].border) : "border-line bg-surface/60 text-ink-2",
                interactive && "hover:text-ink",
              );
              const handlers = {
                onMouseEnter: () => setActive(g.id),
                onMouseLeave: () => setActive(null),
                onFocus: () => setActive(g.id),
                onBlur: () => setActive(null),
              };
              const content = (
                <>
                  <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", toneClass[g.tone].bg)} />
                  {g.label}
                  {interactive && <span className="text-ink-3">{String(g.items.length).padStart(2, "0")}</span>}
                </>
              );
              return (
                <li key={g.id}>
                  {interactive ? (
                    <a href={`#skill-${g.id}`} className={chipClass} {...handlers}>
                      {content}
                    </a>
                  ) : (
                    <span className={chipClass} onMouseEnter={handlers.onMouseEnter} onMouseLeave={handlers.onMouseLeave}>
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
