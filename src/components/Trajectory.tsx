import type { CSSProperties, ReactNode } from "react";
import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import { education, experience, filled, has } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";

type Entry = { period: string; title: string; org: string; meta?: string; bullets?: string[] };

/** Experience + Education as one "trajectory": two lanes on desktop, stacked on mobile. */
export default function Trajectory() {
  const work: Entry[] = experience.map((e) => ({ period: e.period, title: e.role, org: e.org, bullets: e.bullets }));
  const study: Entry[] = education.map((e) => ({
    period: e.period,
    title: e.program,
    org: e.school,
    meta: filled(e.gpa) ? `GPA ${e.gpa}` : undefined,
  }));
  const lanes = [
    has(work) && { key: "work", label: "Experience", Icon: BriefcaseBusiness, tone: "bg-cyan", entries: work },
    has(study) && { key: "study", label: "Education", Icon: GraduationCap, tone: "bg-violet", entries: study },
  ].filter(Boolean) as { key: string; label: string; Icon: typeof GraduationCap; tone: string; entries: Entry[] }[];

  return (
    <section id="trajectory" aria-labelledby="trajectory-title" className="section-y container-x">
      <SectionHeading
        id="trajectory-title"
        index={sectionIndex("trajectory")}
        eyebrow="Trajectory"
        title="Experience & education"
      />

      <div className={cn("grid gap-12", lanes.length > 1 && "md:grid-cols-2 md:gap-10")}>
        {lanes.map((lane, li) => (
          <Lane key={lane.key} label={lane.label} icon={<lane.Icon className="h-4 w-4" aria-hidden />} delay={li}>
            {lane.entries.map((e, i) => (
              <li key={`${e.org}-${i}`} className="reveal relative pb-10 pl-8 last:pb-0" style={{ "--i": li + i + 1 } as CSSProperties}>
                <span
                  aria-hidden
                  className={cn("absolute left-0 top-1.5 h-[9px] w-[9px] -translate-x-1/2 rounded-full ring-4 ring-bg", lane.tone)}
                />
                <p className="font-mono text-xs text-ink-3">{e.period}</p>
                <h4 className="mt-2 text-h3">{e.title}</h4>
                <p className="mt-1 text-ink-2">
                  {e.org}
                  {e.meta && <span className="ml-2 font-mono text-xs text-ink-3">· {e.meta}</span>}
                </p>
                {has(e.bullets) && (
                  <ul className="mt-4 space-y-2 text-sm text-ink-2">
                    {e.bullets.map((b) => (
                      <li key={b} className="flex gap-3">
                        <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-ink-3" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </Lane>
        ))}
      </div>
    </section>
  );
}

function Lane({ label, icon, delay, children }: { label: string; icon: ReactNode; delay: number; children: ReactNode }) {
  return (
    <div>
      <h3 className="reveal label-mono mb-8 flex items-center gap-2.5 text-ink-2" style={{ "--i": delay } as CSSProperties}>
        {icon}
        {label}
      </h3>
      {/* the line "draws" from the top when revealed */}
      <ol className="reveal reveal-line relative ml-1">{children}</ol>
    </div>
  );
}
