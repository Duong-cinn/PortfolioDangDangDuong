import type { CSSProperties } from "react";
import { ArrowUpRight, Github } from "lucide-react";
import { filled, has, projects } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";
import { cardClass } from "./ui/Card";
import { Tag } from "./ui/Tag";

/** Rendered only when `projects` has entries (see data/sections.ts). Full redesign in Phase 3. */
export default function Projects() {
  if (!has(projects)) return null;

  return (
    <section id="projects" aria-labelledby="projects-title" className="section-y container-x">
      <SectionHeading id="projects-title" index={sectionIndex("projects")} eyebrow="Satellites" title="Selected work" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <article
            key={p.title}
            className={cn(
              "reveal group flex flex-col overflow-hidden transition-[transform,border-color] duration-base ease-out-expo hover:-translate-y-0.5 hover:border-cyan/40",
              cardClass,
            )}
            style={{ "--i": i } as CSSProperties}
          >
            {filled(p.image) && (
              <div className="aspect-[16/10] overflow-hidden bg-elevated">
                <img src={p.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-6">
              <p className="label-mono">{p.role}</p>
              <h3 className="mt-2 text-h3">{p.title}</h3>
              <p className="mt-3 flex-1 text-sm text-ink-2">{p.problem}</p>
              {filled(p.result) && <p className="mt-3 text-sm text-ink">{p.result}</p>}
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {p.stack.map((t) => (
                  <li key={t}>
                    <Tag>{t}</Tag>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-5 text-sm">
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
        ))}
      </div>
    </section>
  );
}
