import type { CSSProperties, ReactNode } from "react";
import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import { education, experience, filled, has } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";

type Entry = { period: string; title: string; org: string; meta?: string; bullets?: string[] };
type LaneData = { key: string; label: string; Icon: typeof GraduationCap; tone: "cyan" | "violet"; entries: Entry[] };

/** Climbing-hold silhouettes (12×12). Picked by index so each milestone looks hand-set. */
const HOLDS = [
  "2,5 5,1.5 10,2.5 11,7 7,11 2.5,9.5",
  "1.5,6 4,2 9,1.5 11,5 9.5,10 4,10.5",
  "3,2 8.5,1.5 11,6 8,10.5 2.5,9 1,5",
];

/**
 * Experience + Education as one "trajectory": two lanes on desktop, stacked on mobile.
 * Each lane is drawn as a climbing route — the rope draws in on reveal, milestones are holds.
 */
export default function Trajectory() {
  const work: Entry[] = experience.map((e) => ({ period: e.period, title: e.role, org: e.org, bullets: e.bullets }));
  const study: Entry[] = education.map((e) => ({
    period: e.period,
    title: e.program,
    org: e.school,
    meta: filled(e.gpa) ? `GPA ${e.gpa}` : undefined,
  }));
  const lanes = [
    has(work) && { key: "work", label: "Experience", Icon: BriefcaseBusiness, tone: "cyan", entries: work },
    has(study) && { key: "study", label: "Education", Icon: GraduationCap, tone: "violet", entries: study },
  ].filter(Boolean) as LaneData[];

  return (
    <section id="trajectory" aria-labelledby="trajectory-title" className="section-y container-x">
      <SectionHeading
        id="trajectory-title"
        index={sectionIndex("trajectory")}
        eyebrow="Trajectory"
        title="Experience & education"
        description="Every route starts at the bottom of the wall — here is mine so far."
      />

      <div className={cn("grid gap-12", lanes.length > 1 && "md:grid-cols-2 md:gap-10")}>
        {lanes.map((lane, li) => (
          <Lane key={lane.key} lane={lane} delay={li} icon={<lane.Icon className="h-4 w-4" aria-hidden />}>
            {lane.entries.map((e, i) => (
              <li key={`${e.org}-${i}`} className="reveal relative pb-10 pl-8 last:pb-0" style={{ "--i": li + i + 1 } as CSSProperties}>
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className={cn(
                    "route-hold absolute left-0 top-1 h-4 w-4",
                    lane.tone === "cyan" ? "fill-cyan" : "fill-violet",
                  )}
                  style={{ "--r": `${(li * 3 + i) * 47}deg` } as CSSProperties}
                >
                  <polygon points={HOLDS[(li + i) % HOLDS.length]} />
                  <circle cx="6.2" cy="6" r="1.4" className="fill-bg" />
                </svg>
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

function Lane({ lane, icon, delay, children }: { lane: LaneData; icon: ReactNode; delay: number; children: ReactNode }) {
  return (
    <div>
      <h3 className="reveal label-mono mb-8 flex items-center gap-2.5 text-ink-2" style={{ "--i": delay } as CSSProperties}>
        {icon}
        {lane.label}
      </h3>
      <ol className="reveal route relative ml-1">
        {/* rope: a gently wandering line, stretched to the list height; revealed top → bottom */}
        <svg
          aria-hidden
          viewBox="0 0 16 100"
          preserveAspectRatio="none"
          className="route-rope pointer-events-none absolute -bottom-2 left-0 top-1 h-[calc(100%+0.25rem)] w-4 -translate-x-1/2 overflow-visible"
        >
          <path
            d="M8 0 C12 8 4 17 8 25 S12 42 8 50 S4 67 8 75 S12 92 8 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className={cn("stroke-[1.25]", lane.tone === "cyan" ? "stroke-cyan/45" : "stroke-violet/45")}
          />
          <path
            d="M8 0 C12 8 4 17 8 25 S12 42 8 50 S4 67 8 75 S12 92 8 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="1 7"
            className="stroke-line stroke-[3]"
          />
        </svg>
        {children}
      </ol>
    </div>
  );
}
