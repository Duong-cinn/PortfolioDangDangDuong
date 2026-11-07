import { useRef, type CSSProperties } from "react";
import { Activity, BrainCircuit, Mountain, Orbit, type LucideIcon } from "lucide-react";
import { about, education, filled, has, process, projects, site, skillGroups, socials, type Project } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { useTilt } from "@/hooks/useTilt";
import { projectColumns } from "@/lib/layout";
import { cn } from "@/lib/utils";
import TypingCode from "./TypingCode";
import { BtnLink, Eyebrow } from "./ui/Btn";

const ICONS: LucideIcon[] = [Orbit, BrainCircuit, Activity, Mountain];

/** The "profile" object typed in the code block — built from real config data. */
function profileCode() {
  const top = skillGroups.flatMap((g) => g.items.slice(0, 2).map((i) => `"${i.name}"`));
  const edu = education[0];
  const lines = [
    `export const duong = {`,
    `  role: "${site.role}",`,
    edu ? `  school: "VNU-IS · ${edu.period.replace(/\s*—\s*/, " → ")}",` : null,
    `  based: "${site.location} (${site.timezone})",`,
    `  stack: [${top.slice(0, 4).join(", ")}],`,
    has(about.research) ? ["  exploring: [", ...about.research.map((r) => `    "${r}",`), "  ],"].join("\n") : null,
    `  openToWork: true,`,
    `};`,
  ];
  return lines.filter(Boolean).join("\n");
}

export default function Projects() {
  if (!has(projects)) return null;
  const cols = projectColumns(projects.length);
  const github = socials.find((s) => s.name === "GitHub");

  return (
    <section id="projects" aria-labelledby="projects-title" className="section work">
      <div className="split">
        <div className="reveal">
          <Eyebrow index={sectionIndex("projects")}>Selected work</Eyebrow>
          <h2 id="projects-title" className="h-display">
            Build boldly, ship small, learn fast, <span className="accent">measure</span> <em className="serif">truth.</em>
          </h2>
          <p className="lede">
            Each project is a satellite of the orbit — a real problem, a clear role, and a result I can point to.
          </p>
          <div className="btn-row">
            {github && (
              <BtnLink href={github.href} variant="white" target="_blank" rel="noreferrer noopener">
                <github.Icon className="h-4 w-4" aria-hidden /> GitHub profile
              </BtnLink>
            )}
            <BtnLink href="#contact" variant="dark">
              Get in touch
            </BtnLink>
          </div>
        </div>

        <figure className="code reveal" aria-hidden style={{ "--d": 1 } as CSSProperties}>
          <figcaption className="code__head">
            <span>profile.ts</span>
            <span>TypeScript 5</span>
          </figcaption>
          <TypingCode code={profileCode()} className="code__body" />
          <div className="code__foot">
            <span>~/ninh-binh</span>
            <span className="chip--live-dot">ready</span>
          </div>
        </figure>
      </div>

      <ul className="cards" style={{ "--cols": cols } as CSSProperties}>
        {projects.map((p, i) => (
          <li key={p.title} className="reveal" style={{ "--d": i % cols } as CSSProperties}>
            <ProjectCard project={p} index={i} lead={i === 0} />
          </li>
        ))}
      </ul>

      {has(process) && (
        <ol className="steps reveal">
          {process.map((s) => (
            <li key={s.lead}>
              <span>
                <b>{s.lead}</b> {s.body}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ProjectCard({ project: p, index, lead }: { project: Project; index: number; lead: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useTilt(ref);
  const Icon = ICONS[index % ICONS.length];
  const code = `MSN-${String(index + 1).padStart(2, "0")}`;
  const status = filled(p.demo) ? "Live" : filled(p.github) ? "Code" : "Concept";
  const link = filled(p.demo) ? p.demo : filled(p.github) ? p.github : null;

  return (
    <article ref={ref} className={cn("card mission glass spot tilt hud-frame holo", lead && "mission--lead")}>
      <span aria-hidden className="tilt-glare" />
      <div className="mission__head">
        <span>
          {code} · {p.role}
        </span>
        <span className={cn("mission__status", status === "Concept" ? "is-concept" : "is-live")}>{status}</span>
      </div>

      <div className="mission__screen" aria-hidden>
        {filled(p.image) ? <img src={p.image} alt="" loading="lazy" decoding="async" /> : <OrbitScreen seed={index} />}
        <Icon className="mission__icon" strokeWidth={1.3} />
        <span className="mission__readout">
          ORB {(0.31 + ((index * 0.137) % 0.5)).toFixed(2)} · INC {12 + ((index * 17) % 40)}°
        </span>
      </div>

      <h3 className="card__title">{p.title}</h3>
      <p className="card__body">{p.problem}</p>

      <p className="mission__label">Modules</p>
      <ul className="mission__modules" aria-label="Tech stack">
        {p.stack.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div className="card__meta">
        <div>
          {filled(p.result) && (
            <>
              <p className="mission__label">Outcome</p>
              <p className="card__result">{p.result}</p>
            </>
          )}
        </div>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer noopener" className="mission__launch">
            Launch →<span className="sr-only">: {p.title} (opens in a new tab)</span>
          </a>
        ) : (
          <span className="card__soon">Briefing soon</span>
        )}
      </div>
    </article>
  );
}

/** Preview screen for projects without an image: a satellite on its orbit, seeded per project. */
function OrbitScreen({ seed }: { seed: number }) {
  const tilt = -22 + ((seed * 37) % 44);
  const angle = (seed * 1.9 + 0.6) % (Math.PI * 2);
  const x = 200 + Math.cos(angle) * 150;
  const y = 90 + Math.sin(angle) * 42;
  return (
    <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" className="mission__art">
      <defs>
        <radialGradient id={`ms-core-${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="35%" stopColor="#8d94ff" />
          <stop offset="100%" stopColor="#2b1f8f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`rotate(${tilt} 200 90)`}>
        <ellipse cx="200" cy="90" rx="150" ry="42" fill="none" stroke="rgba(160,170,255,0.45)" />
        <ellipse cx="200" cy="90" rx="100" ry="28" fill="none" stroke="rgba(95,227,255,0.5)" strokeDasharray="2 6" />
        <circle cx="200" cy="90" r="26" fill={`url(#ms-core-${seed})`} />
        <g className="mission__sat" style={{ transformOrigin: "200px 90px" }}>
          <rect x={x - 6} y={y - 6} width="12" height="12" transform={`rotate(45 ${x} ${y})`} fill="#5fe3ff" />
          <circle cx={x} cy={y} r="14" fill="none" stroke="rgba(95,227,255,0.5)" />
        </g>
      </g>
      <g stroke="rgba(95,227,255,0.35)" strokeWidth="1">
        <path d="M14 14h18M14 14v18M386 14h-18M386 14v18M14 166h18M14 166v-18M386 166h-18M386 166v-18" fill="none" />
      </g>
    </svg>
  );
}
