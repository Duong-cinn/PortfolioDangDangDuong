import type { CSSProperties } from "react";
import { ArrowUpRight, Award, BadgeCheck } from "lucide-react";
import { certificates, filled, has } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";
import { cardClass } from "./ui/Card";

/** Certificates + achievements in one list. Hidden when `certificates` is empty. */
export default function Certificates() {
  if (!has(certificates)) return null;
  const hasAchievements = certificates.some((c) => c.kind === "achievement");

  return (
    <section id="certificates" aria-labelledby="certificates-title" className="section-y container-x">
      <SectionHeading
        id="certificates-title"
        index={sectionIndex("certificates")}
        eyebrow="Proof"
        title={hasAchievements ? "Certificates & achievements" : "Certificates"}
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {certificates.map((c, i) => {
          const Icon = c.kind === "achievement" ? Award : BadgeCheck;
          const body = (
            <>
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", c.kind === "achievement" ? "text-violet" : "text-cyan")} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="mt-1 text-sm text-ink-2">{c.issuer}</p>
              </div>
              <span className="font-mono text-xs text-ink-3">{c.year}</span>
              {filled(c.url) && <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-cyan" aria-hidden />}
            </>
          );
          return (
            <li key={`${c.name}-${c.year}`} className="reveal" style={{ "--i": i } as CSSProperties}>
              {filled(c.url) ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn("group flex items-start gap-4 p-5 transition-colors hover:border-cyan/40", cardClass)}
                >
                  {body}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <div className={cn("flex items-start gap-4 p-5", cardClass)}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
