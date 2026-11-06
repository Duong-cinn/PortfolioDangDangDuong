import { useRef, type CSSProperties } from "react";
import { ArrowUpRight, Github } from "lucide-react";
import { filled, has, projects, type Project } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { useTilt } from "@/hooks/useTilt";
import { hasFeaturedProject } from "@/lib/layout";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";
import { cardClass } from "./ui/Card";
import { Tag } from "./ui/Tag";

/** Projects = the satellites of the hero orbit. Hidden when `projects` is empty. */
export default function Projects() {
  if (!has(projects)) return null;
  const featured = hasFeaturedProject(projects.length);

  return (
    <section id="projects" aria-labelledby="projects-title" className="section-y container-x">
      <SectionHeading
        id="projects-title"
        index={sectionIndex("projects")}
        eyebrow="Satellites"
        title="Selected work"
        description="Each project is a satellite in the orbit above — launched, then kept in motion."
      />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <li
            key={p.title}
            className={cn("reveal", featured && i === 0 && "lg:col-span-2")}
            style={{ "--i": i } as CSSProperties}
          >
            <ProjectCard project={p} index={i} featured={featured && i === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectCard({ project: p, index, featured }: { project: Project; index: number; featured: boolean }) {
  const code = `S-${String(index + 1).padStart(2, "0")}`;
  const ref = useRef<HTMLElement>(null);
  useTilt(ref);
  return (
    <article
      ref={ref}
      className={cn("tilt group relative flex h-full flex-col overflow-hidden hover:border-cyan/40", cardClass)}
    >
      <span aria-hidden className="tilt-glare" />
      <div className={cn("relative overflow-hidden bg-elevated", featured ? "aspect-[21/9]" : "aspect-[16/10]")}>
        {filled(p.image) ? (
          <img
            src={p.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-slow ease-out-expo group-hover:scale-[1.03]"
          />
        ) : (
          <SatelliteArt seed={index} />
        )}
        <span className="absolute left-4 top-4 rounded-full border border-line bg-bg/70 px-2.5 py-1 font-mono text-[11px] text-ink-2 backdrop-blur">
          {code}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {filled(p.role) && <p className="label-mono">{p.role}</p>}
        <h3 className="mt-2 text-h3">{p.title}</h3>
        <p className="mt-3 text-sm text-ink-2">{p.problem}</p>
        {filled(p.result) && (
          <p className="mt-3 border-l-2 border-cyan/60 pl-3 text-sm text-ink">{p.result}</p>
        )}
        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {p.stack.map((t) => (
            <li key={t}>
              <Tag>{t}</Tag>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex gap-5 pt-6 text-sm">
          {filled(p.demo) && (
            <a href={p.demo} target="_blank" rel="noreferrer noopener" className="link-underline inline-flex items-center gap-1">
              Live <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">: {p.title} (opens in a new tab)</span>
            </a>
          )}
          {filled(p.github) && (
            <a href={p.github} target="_blank" rel="noreferrer noopener" className="link-underline inline-flex items-center gap-1 text-ink-2">
              <Github className="h-3.5 w-3.5" aria-hidden /> Code
              <span className="sr-only">: {p.title} (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/** Generated cover for projects without an image: a satellite on its own orbit. */
function SatelliteArt({ seed }: { seed: number }) {
  const tilt = -24 + ((seed * 37) % 48);
  const angle = (seed * 1.7) % (Math.PI * 2);
  const x = 200 + Math.cos(angle) * 150;
  const y = 100 + Math.sin(angle) * 46;
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={`sat-${seed}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--violet))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="rgb(var(--violet))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#sat-${seed})`} />
      <g transform={`rotate(${tilt} 200 100)`}>
        <ellipse cx="200" cy="100" rx="150" ry="46" fill="none" className="stroke-ink-3" strokeOpacity="0.5" />
        <ellipse cx="200" cy="100" rx="96" ry="30" fill="none" className="stroke-cyan" strokeOpacity="0.35" strokeDasharray="2 6" />
        <circle cx="200" cy="100" r="16" className="fill-ink-3" fillOpacity="0.35" />
        <rect x={x - 6} y={y - 6} width="12" height="12" transform={`rotate(45 ${x} ${y})`} className="fill-cyan" />
      </g>
    </svg>
  );
}
