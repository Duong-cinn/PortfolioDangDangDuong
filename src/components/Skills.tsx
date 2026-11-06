import type { CSSProperties } from "react";
import { has, skillGroups } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { toneClass } from "@/lib/tone";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";
import { cardClass } from "./ui/Card";

export default function Skills() {
  const groups = skillGroups.filter((g) => has(g.items));

  return (
    <section id="skills" aria-labelledby="skills-title" className="section-y container-x">
      <SectionHeading
        id="skills-title"
        index={sectionIndex("skills")}
        eyebrow="Orbits"
        title="Skills"
        description="Each group is one ring of the orbit above — innermost is where I spend most of my time."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g, i) => (
          <article
            key={g.id}
            id={`skill-${g.id}`}
            className={cn(
              "reveal relative overflow-hidden p-6 transition-[border-color,box-shadow] duration-slow target:border-cyan/60 target:shadow-glow",
              cardClass,
            )}
            style={{ "--i": i } as CSSProperties}
          >
            <span aria-hidden className={cn("absolute inset-y-0 left-0 w-0.5", toneClass[g.tone].bg)} />
            <h3 className="flex items-center justify-between text-h3">
              {g.label}
              <span className="font-mono text-xs font-normal text-ink-3">{String(g.items.length).padStart(2, "0")}</span>
            </h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {g.items.map(({ name, Icon }) => (
                <li
                  key={name}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-bg/40 px-2.5 py-1.5 text-sm text-ink-2"
                >
                  {Icon && <Icon className="h-4 w-4 text-ink-3" aria-hidden />}
                  {name}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
