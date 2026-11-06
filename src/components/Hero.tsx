import type { CSSProperties } from "react";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { filled, site, skillGroups } from "@/data/config";
import { toneClass } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ui/Button";
import OrbitFallback from "./hero/OrbitFallback";

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <div className="container-x grid min-h-[min(calc(100svh-var(--header-h)),880px)] items-center gap-12 pb-20 pt-12 md:grid-cols-8 md:pt-16 lg:grid-cols-12 lg:gap-8">
        {/* Text — always the dominant layer */}
        <div className="md:col-span-5 lg:col-span-7">
          <p className="reveal label-mono flex flex-wrap items-center gap-x-3 gap-y-1" style={stagger(0)}>
            <span className="text-cyan">{site.coords}</span>
            <span aria-hidden className="h-px w-6 bg-line" />
            <span>
              {site.location} · {site.timezone}
            </span>
          </p>

          {/* h1 is intentionally NOT a .reveal — it is the LCP element and must paint immediately. */}
          <h1 id="hero-title" className="mt-6 text-display">
            {site.name}
          </h1>

          <p className="reveal mt-5 font-display text-h3 font-medium text-ink-2" style={stagger(1)}>
            {site.role}
            <span className="text-cyan">.</span>
          </p>

          {filled(site.focus) && (
            <p className="reveal mt-2 text-sm text-ink-3" style={stagger(2)}>
              {site.focus}
            </p>
          )}

          {filled(site.tagline) && (
            <p className="reveal mt-6 max-w-prose text-ink-2" style={stagger(3)}>
              {site.tagline}
            </p>
          )}

          {filled(site.availability) && (
            <p
              className="reveal mt-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-sm text-ink-2"
              style={stagger(3)}
            >
              <span aria-hidden className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
                <span className="relative h-2 w-2 rounded-full bg-success" />
              </span>
              {site.availability}
            </p>
          )}

          <div className="reveal mt-8 flex flex-wrap gap-3" style={stagger(4)}>
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

        {/* Orbit object — static SVG now, lazy 3D in Phase 2 (same box, no layout shift) */}
        <div className="md:col-span-3 lg:col-span-5">
          <div className="relative mx-auto aspect-square w-[min(78vw,320px)] md:w-full md:max-w-[420px] lg:max-w-[540px]">
            <OrbitFallback />
          </div>

          <ul aria-label="Skill orbits" className="mt-6 flex flex-wrap justify-center gap-2">
            {skillGroups.map((g) => (
              <li
                key={g.id}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-xs text-ink-2"
              >
                <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", toneClass[g.tone].bg)} />
                {g.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
