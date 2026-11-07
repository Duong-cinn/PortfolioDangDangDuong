import { useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, Briefcase, Compass, LayoutGrid, Mail, Search } from "lucide-react";
import { filled, focus, has, projects, site, skillGroups, type Project } from "@/data/config";
import github from "@/data/github.json";
import { sectionIndex } from "@/data/sections";
import { openPalette } from "@/lib/palette";
import { series, sparkline } from "@/lib/series";
import { cn } from "@/lib/utils";
import { Chip, Eyebrow } from "./ui/Btn";

/** Accent per group, in ring order (index 0 = innermost ring). */
const TONES = ["#5fe3ff", "#a99bff", "#ff8fd8", "#7cf0bd", "#ffc27a"];
const BAR_TONES = ["#5fe3ff", "#a99bff", "#ff8fd8", "#ffc27a", "#7cf0bd"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");

/** Which projects use at least one skill of the group (loose name match). */
function usesGroup(p: Project, names: string[]) {
  const stack = p.stack.map(norm);
  return names.some((n) => {
    const k = norm(n);
    return stack.some((s) => s.includes(k) || k.includes(s));
  });
}

/**
 * Skills as a live "dev console" (the landing page's product dashboard, made real):
 * the sidebar / KPI tiles filter the stack and dim projects that don't use that group.
 * Tilts upright in 3D as it scrolls in (`data-scroll` → --p).
 */
export default function Skills() {
  const groups = skillGroups.filter((g) => has(g.items));
  const [filter, setFilter] = useState<string | null>(null);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const shown = filter ? groups.filter((g) => g.id === filter) : groups;
  const active = groups.find((g) => g.id === filter);
  const activeNames = active?.items.map((i) => i.name) ?? [];

  const sparks = useMemo(() => groups.map((g, i) => sparkline(series(14, 3 + i * 4, 18, 6, 8 + g.items.length))), [groups]);
  // real GitHub language share when the build-time snapshot has it, else the hand-written split
  const gh = has(github.languages);
  const bars = gh ? github.languages.map((l) => ({ label: l.name, value: l.pct })) : focus;
  const maxBar = Math.max(1, ...bars.map((f) => f.value));
  const toggle = (id: string | null) => setFilter((cur) => (cur === id ? null : id));

  return (
    <section id="skills" aria-labelledby="skills-title" className="section skills">
      <div className="section-head section-head--center">
        <Eyebrow index={sectionIndex("skills")} className="reveal">
          Skills
        </Eyebrow>
        <h2 id="skills-title" className="h-display reveal">
          My stack, as a <em className="serif">live</em> <span className="accent">console.</span>
        </h2>
        <p className="lede reveal">Pick a group in the sidebar — the console filters itself, and the projects that use it light up.</p>
      </div>

      <div className="console-stage" data-scroll>
        <div id="console" className="console reveal">
          {/* top bar */}
          <div className="console-top">
            <span className="console-brand">
              <span aria-hidden className="orb orb--sm" />
              {site.shortName}
              <span className="text-cyan">.</span>
            </span>
            <span className="console-crumb">
              skills&nbsp;&nbsp;/&nbsp;&nbsp;<b>{active ? active.label : "Overview"}</b>
            </span>
            <span className="console-spacer" />
            <button type="button" className="console-search js-only" onClick={openPalette}>
              <Search className="h-[1.1em] w-[1.1em]" aria-hidden />
              Search skills
              <kbd>⌘K</kbd>
            </button>
            <Chip live>Learning</Chip>
            <span aria-hidden className="console-avatar">
              ĐD
            </span>
          </div>

          <div className="console-body">
            {/* sidebar */}
            <nav className="console-side" aria-label="Skill groups">
              <p className="console-side__label">Workspace</p>
              <button type="button" aria-pressed={!filter} className="console-side__item" onClick={() => setFilter(null)}>
                <LayoutGrid aria-hidden />
                Overview
                <span>{String(total).padStart(2, "0")}</span>
              </button>
              {groups.map((g, i) => (
                <button
                  key={g.id}
                  id={`skill-${g.id}`}
                  type="button"
                  aria-pressed={filter === g.id}
                  className="console-side__item"
                  onClick={() => toggle(g.id)}
                >
                  <i aria-hidden style={{ background: TONES[i % TONES.length] }} />
                  {g.label}
                  <span>{String(g.items.length).padStart(2, "0")}</span>
                </button>
              ))}
              <p className="console-side__label console-side__label--gap">Library</p>
              {has(projects) && (
                <a href="#projects" className="console-side__item">
                  <Briefcase aria-hidden />
                  Projects
                  <span>{String(projects.length).padStart(2, "0")}</span>
                </a>
              )}
              <a href="#trajectory" className="console-side__item">
                <Compass aria-hidden />
                Journey
              </a>
              <a href="#contact" className="console-side__item">
                <Mail aria-hidden />
                Contact
              </a>
            </nav>

            {/* main */}
            <div className="console-main">
              <div className="console-head">
                <h3>{active ? active.label : "Skill overview"}</h3>
                <Chip tone="up">▲ always learning</Chip>
                <span className="console-spacer" />
                <a href="#contact" className="console-cta">
                  + Hire me
                </a>
              </div>

              <ul className="kpis">
                {groups.map((g, i) => {
                  const tone = TONES[i % TONES.length];
                  const [line, area] = sparks[i];
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        className={cn("kpi", filter === g.id && "is-active", filter && filter !== g.id && "is-dim")}
                        aria-pressed={filter === g.id}
                        onClick={() => toggle(g.id)}
                        style={{ "--tone": tone } as CSSProperties}
                      >
                        <span className="kpi__label">{g.label}</span>
                        <span className="kpi__row">
                          <span className="kpi__value">{String(g.items.length).padStart(2, "0")}</span>
                          <Chip tone="up">{Math.round((g.items.length / total) * 100)}%</Chip>
                        </span>
                        <svg viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden className="kpi__spark">
                          <defs>
                            <linearGradient id={`spark-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={tone} stopOpacity="0.35" />
                              <stop offset="100%" stopColor={tone} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={area} fill={`url(#spark-${g.id})`} className="draw-fill" />
                          <path d={line} fill="none" stroke={tone} strokeWidth="1.6" vectorEffect="non-scaling-stroke" pathLength={1} className="draw-line" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="console-panes">
                <div className="pane">
                  <div className="pane__head">
                    <h4>Stack</h4>
                    <span className="pane__legend">
                      {shown.length} group{shown.length > 1 ? "s" : ""} · {shown.reduce((n, g) => n + g.items.length, 0)} tools
                    </span>
                  </div>
                  <ul className="stack-list" key={filter ?? "all"}>
                    {shown.flatMap((g) =>
                      g.items.map(({ name, Icon }, j) => (
                        <li key={`${g.id}-${name}`} style={{ "--tone": TONES[groups.indexOf(g) % TONES.length], "--j": j } as CSSProperties}>
                          {Icon ? <Icon className="h-[1em] w-[1em]" aria-hidden /> : <i aria-hidden />}
                          {name}
                        </li>
                      )),
                    )}
                  </ul>
                </div>

                {has(bars) && (
                  <div className="pane">
                    <div className="pane__head">
                      <h4>{gh ? "GitHub · languages" : "Where my time goes"}</h4>
                      {gh && (
                        <a href={`https://github.com/${github.user}`} target="_blank" rel="noreferrer noopener" className="pane__legend pane__link">
                          {github.publicRepos} repos ↗
                        </a>
                      )}
                    </div>
                    <ul className="bars">
                      {bars.map((f, i) => (
                        <li key={f.label}>
                          <span className="bars__row">
                            {f.label}
                            <span>{f.value}%</span>
                          </span>
                          <span className="bars__track">
                            <span
                              className="bars__fill"
                              style={{ "--w": `${(f.value / maxBar) * 100}%`, "--tone": BAR_TONES[i % BAR_TONES.length] } as CSSProperties}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                    {gh && github.lastPush && (
                      <p className="pane__foot">
                        last push · <b>{github.lastPush.repo}</b> · {github.lastPush.at.slice(0, 10)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {has(projects) && (
                <div className="table" role="table" aria-label="Projects and their stack">
                  <div className="table__row table__row--head" role="row">
                    <span role="columnheader">Project</span>
                    <span role="columnheader">Role</span>
                    <span role="columnheader" className="table__stack">
                      Stack
                    </span>
                    <span role="columnheader">Status</span>
                  </div>
                  {projects.map((p) => {
                    const dim = !!active && !usesGroup(p, activeNames);
                    return (
                      <div key={p.title} role="row" className={cn("table__row", dim && "is-dim")}>
                        <span role="cell" className="table__title">
                          {p.title}
                        </span>
                        <span role="cell">{p.role}</span>
                        <span role="cell" className="table__stack mono">
                          {p.stack.slice(0, 3).join(" · ")}
                        </span>
                        <span role="cell">
                          {filled(p.demo) ? (
                            <a href={p.demo} target="_blank" rel="noreferrer noopener" className="chip chip--live">
                              Live <ArrowUpRight className="h-3 w-3" aria-hidden />
                            </a>
                          ) : filled(p.github) ? (
                            <a href={p.github} target="_blank" rel="noreferrer noopener" className="chip">
                              Code <ArrowUpRight className="h-3 w-3" aria-hidden />
                            </a>
                          ) : (
                            <Chip>Concept</Chip>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
