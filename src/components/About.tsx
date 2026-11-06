import type { CSSProperties } from "react";
import { about, has, site } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";
import { Tag } from "./ui/Tag";

export default function About() {
  const hasBio = has(about.bio);

  return (
    <section id="about" aria-labelledby="about-title" className="section-y container-x">
      <SectionHeading id="about-title" index={sectionIndex("about")} eyebrow="Who I am" title="About" />

      <div className="grid gap-12 lg:grid-cols-12">
        {hasBio && (
          <div className="space-y-5 text-ink-2 lg:col-span-7">
            {about.bio.map((p, i) => (
              <p key={i} className="reveal max-w-prose" style={{ "--i": i } as CSSProperties}>
                {p}
              </p>
            ))}
          </div>
        )}

        <dl className={cn("grid gap-10", hasBio ? "lg:col-span-5" : "sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3")}>
          {has(about.research) && (
            <div className="reveal">
              <dt className="label-mono">Currently exploring</dt>
              <dd className="mt-4">
                <ul className="flex flex-wrap gap-2">
                  {about.research.map((r) => (
                    <li key={r}>
                      <Tag className="border-violet/40 text-ink">{r}</Tag>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {has(about.hobbies) && (
            <div className="reveal" style={{ "--i": 1 } as CSSProperties}>
              <dt className="label-mono">Off-screen</dt>
              <dd className="mt-4">
                <ul className="grid grid-cols-2 gap-3">
                  {about.hobbies.map(({ label, Icon }) => (
                    <li key={label} className="flex items-center gap-2.5 text-ink-2">
                      <Icon className="h-4 w-4 text-ink-3" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          <div className="reveal" style={{ "--i": 2 } as CSSProperties}>
            <dt className="label-mono">Based in</dt>
            <dd className="mt-4 text-ink-2">
              {site.location}
              <span className="block font-mono text-xs text-ink-3">{site.timezone}</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
