import type { CSSProperties } from "react";
import { about, has, site, socials, statement, stats } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { richText } from "@/lib/richText";
import HudStats from "./HudStats";
import { BtnLink, Chip, Eyebrow } from "./ui/Btn";

/** Statement → stats → bio + facts. The ship glides past on the left. */
export default function About() {
  const github = socials.find((s) => s.name === "GitHub");

  return (
    <section id="about" aria-labelledby="about-title" className="section about">
      <div className="about-head">
        <Eyebrow index={sectionIndex("about")} className="reveal">
          Who I am
        </Eyebrow>
        <h2 id="about-title" className="h-display reveal">
          {richText(statement)}
        </h2>
        <p className="lede reveal">
          {site.focus}. {site.availability}.
        </p>
        <div className="btn-row reveal">
          <BtnLink href="#contact">Get in touch</BtnLink>
          {github && (
            <BtnLink href={github.href} variant="ghost" target="_blank" rel="noreferrer noopener">
              <github.Icon className="h-4 w-4" aria-hidden /> GitHub
            </BtnLink>
          )}
        </div>
      </div>

      {has(stats) && <HudStats stats={stats} />}

      <div className="about-grid">
        {has(about.bio) && (
          <article className="glass spot hud-frame about-bio reveal">
            <WindowBar file="about.md" meta="markdown · 3 ¶" />
            {about.bio.map((p, i) => (
              <p key={i} className={i === 0 ? "about-bio__lead" : undefined}>
                {p}
              </p>
            ))}
          </article>
        )}

        <div className="glass spot hud-frame about-facts reveal" style={{ "--d": 1 } as CSSProperties}>
          <WindowBar file="status.json" meta="live" live />
          <dl className="about-facts__list">
          {has(about.research) && (
            <div>
              <dt className="label">Currently exploring</dt>
              <dd className="chip-row">
                {about.research.map((r) => (
                  <Chip key={r} tone="cyan">
                    {r}
                  </Chip>
                ))}
              </dd>
            </div>
          )}
          {has(about.hobbies) && (
            <div>
              <dt className="label">Off-screen</dt>
              <dd>
                <ul className="hobbies">
                  {about.hobbies.map(({ label, Icon }) => (
                    <li key={label}>
                      <Icon className="h-[1.1em] w-[1.1em]" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          <div>
            <dt className="label">Reach me</dt>
            <dd>
              <a href={`mailto:${site.email}`} className="link">
                {site.email}
              </a>
            </dd>
          </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

/** Terminal-style title bar for the glass windows. */
function WindowBar({ file, meta, live }: { file: string; meta: string; live?: boolean }) {
  return (
    <div className="winbar" aria-hidden>
      <span className="winbar__dots">
        <i />
        <i />
        <i />
      </span>
      <span className="winbar__file">{file}</span>
      <span className={live ? "winbar__meta chip--live-dot" : "winbar__meta"}>{meta}</span>
    </div>
  );
}
