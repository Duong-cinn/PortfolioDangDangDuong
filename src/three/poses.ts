import type { Pose, PoseStop } from "./spaceScene";

/**
 * Ship choreography: one pose per section.
 * x / y in half-viewport units (-1..1, y up), s = ship length as a share of viewport height,
 * yaw (about Y, 0 = nose right), pitch (about Z, negative = nose down), roll (about X), radians.
 */
type Key = "hero" | "about" | "console" | "projects" | "trajectory" | "end";

const desktop: Record<Key, Pose> = {
  hero: { x: 0.42, y: 0.12, s: 0.7, yaw: -0.62, pitch: 0.2, roll: -0.42 },
  about: { x: -0.76, y: 0.12, s: 0.34, yaw: 0.55, pitch: 0.22, roll: 0.3 },
  console: { x: 0.62, y: -0.62, s: 0.44, yaw: -0.4, pitch: 0.32, roll: 0.2 },
  projects: { x: 0.12, y: -0.72, s: 0.44, yaw: 0.45, pitch: 0.1, roll: -0.25 },
  trajectory: { x: 0.58, y: -0.52, s: 0.55, yaw: 0.35, pitch: 0.55, roll: -0.15 },
  end: { x: 0.68, y: 0.5, s: 0.36, yaw: -0.5, pitch: 0.35, roll: -0.3 },
};

const phone: Record<Key, Pick<Pose, "x" | "y" | "s">> = {
  // phones: text fills the width, so the ship mostly peeks in from the edges
  hero: { x: 0.12, y: 0.4, s: 0.44 },
  about: { x: 0.95, y: -0.55, s: 0.2 },
  console: { x: -0.95, y: -0.7, s: 0.2 },
  projects: { x: 0.95, y: -0.72, s: 0.2 },
  trajectory: { x: -0.95, y: -0.75, s: 0.2 },
  end: { x: 0.6, y: -0.82, s: 0.22 },
};

/** Reads section positions from the DOM. Hidden sections are skipped. */
export function measurePoses(): { stops: PoseStop[]; endTop: number } {
  const h = window.innerHeight;
  const small = window.matchMedia("(max-width: 820px)").matches;
  const top = (id: string) => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + window.scrollY : null;
  };
  const pose = (k: Key): Pose => (small ? { ...desktop[k], ...phone[k] } : desktop[k]);
  const maxScroll = document.documentElement.scrollHeight - h;

  const stops: PoseStop[] = [{ at: 0, pose: pose("hero") }];
  const add = (k: Key, at: number | null) => at !== null && stops.push({ at, pose: pose(k) });

  const about = top("about");
  add("about", about === null ? null : about + 0.2 * h);
  const consoleEl = document.getElementById("console");
  if (consoleEl) {
    const r = consoleEl.getBoundingClientRect();
    add("console", r.top + window.scrollY + r.height / 2 - 0.5 * h);
  }
  const projects = top("projects");
  add("projects", projects === null ? null : projects + 0.3 * h);
  const trajectory = top("trajectory");
  add("trajectory", trajectory === null ? null : trajectory + 0.3 * h);
  const end = top("contact");
  const endTop = end ?? Infinity;
  add("end", end === null ? null : Math.min(end, maxScroll));

  stops.sort((a, b) => a.at - b.at);
  return { stops, endTop };
}
