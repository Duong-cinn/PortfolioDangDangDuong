import type { CSSProperties } from "react";
import { Award, BadgeCheck, BriefcaseBusiness, GraduationCap, type LucideIcon } from "lucide-react";
import { certificates, education, experience, filled, has } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { staircase } from "@/lib/layout";
import { ArrowLink, Chip, Eyebrow } from "./ui/Btn";

type Hold = {
  tag: string;
  Icon: LucideIcon;
  title: string;
  org: string;
  body?: string;
  chips: string[];
  year: number;
  link?: string;
};

const firstYear = (s: string) => Number(s.match(/\d{4}/)?.[0] ?? 9999);

/** Education, experience and certificates as one route, oldest first (bottom-left → top-right). */
function holds(): Hold[] {
  const list: Hold[] = [
    ...education.map((e) => ({
      tag: "Education",
      Icon: GraduationCap,
      title: e.program,
      org: e.school,
      chips: [e.period, ...(filled(e.gpa) ? [`GPA ${e.gpa}`] : [])],
      year: firstYear(e.period),
    })),
    ...experience.map((e) => ({
      tag: "Experience",
      Icon: BriefcaseBusiness,
      title: e.role,
      org: e.org,
      body: e.bullets[0],
      chips: [e.period],
      year: firstYear(e.period),
    })),
    ...certificates.map((c) => ({
      tag: c.kind === "achievement" ? "Achievement" : "Certificate",
      Icon: c.kind === "achievement" ? Award : BadgeCheck,
      title: c.name,
      org: c.issuer,
      chips: [c.year],
      year: firstYear(c.year),
      link: c.url,
    })),
  ];
  return list.sort((a, b) => a.year - b.year);
}

export default function Trajectory() {
  const items = holds();
  if (!has(items)) return null;
  const { cards, height } = staircase(items.length);
  // rope through each hold pin (on the top edge of every card), in design units
  const rope = cards.map((c) => [c.left + 40, c.top] as const);
  const ropePath = rope.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x} ${y + 400}L${x} ${y}`;
    const [px, py] = rope[i - 1];
    const mx = (px + x) / 2;
    return `${d} C${mx} ${py} ${mx} ${y} ${x} ${y}`;
  }, "");

  return (
    <section id="trajectory" aria-labelledby="trajectory-title" className="section journey">
      <div className="journey-head">
        <Eyebrow index={sectionIndex("trajectory")} className="reveal">
          Journey
        </Eyebrow>
        <h2 id="trajectory-title" className="h-display reveal">
          A route, not a ladder —
          <br />
          every hold <em className="serif">counts.</em>
        </h2>
        <p className="lede reveal">Study, work and proof, in the order I climbed them. Next hold: yours?</p>
      </div>

      <div className="stairs" data-scroll style={{ "--stairs-h": height } as CSSProperties}>
        <svg aria-hidden className="stairs__rope" viewBox={`0 0 1312 ${height}`} preserveAspectRatio="none">
          <path d={ropePath} pathLength={1} />
        </svg>
        <ol>
          {items.map((h, i) => (
            <li
              key={`${h.tag}-${h.title}`}
              className="stair waypoint glass spot hud-frame holo reveal"
              style={{ "--x": cards[i].left, "--y": cards[i].top, "--d": i } as CSSProperties}
            >
              <span aria-hidden className="stair__hold" />
              <div className="waypoint__head">
                <span>
                  WP-{String(i + 1).padStart(2, "0")} · {h.tag}
                </span>
                <span className="waypoint__alt">ALT {String(150 + i * 300).padStart(4, "0")}m</span>
              </div>
              <div className="waypoint__badge">
                <span className="waypoint__ring">
                  <h.Icon aria-hidden strokeWidth={1.4} />
                </span>
                {h.year < 9999 && <span className="waypoint__year">{h.year}</span>}
              </div>
              <h3 className="stair__title">{h.title}</h3>
              <p className="stair__org">{h.org}</p>
              {filled(h.body) && <p className="stair__body">{h.body}</p>}
              <div className="chip-row">
                {h.chips
                  .filter((c) => c !== String(h.year)) // the year is already shown large
                  .map((c) => (
                    <Chip key={c}>{c}</Chip>
                  ))}
              </div>
              <div className="stair__foot">
                <span className="waypoint__meter" aria-hidden>
                  {items.map((_, k) => (
                    <i key={k} className={k <= i ? "is-on" : undefined} style={{ "--k": k + 1 } as CSSProperties} />
                  ))}
                </span>
                {filled(h.link) ? (
                  <ArrowLink href={h.link} target="_blank" rel="noreferrer noopener">
                    Verify
                    <span className="sr-only">: {h.title} (opens in a new tab)</span>
                  </ArrowLink>
                ) : (
                  <span className="stair__step">
                    Hold {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
