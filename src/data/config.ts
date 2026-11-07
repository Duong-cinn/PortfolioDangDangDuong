import type { ComponentType } from "react";
import { Compass, Dumbbell, Film, Github, Mail, Mountain } from "lucide-react";

export type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

/**
 * Single source of truth for all personal content.
 * Rule: any empty string / empty array hides the matching UI (see `has()` / `filled()`).
 * Items marked `TODO(content)` are waiting for real data — never fill them with invented facts.
 */

/* ───────── Types ───────── */

export type RingTone = "cyan" | "violet" | "gray" | "dotted";

export type Skill = { name: string; Icon?: IconComponent };

export type SkillGroup = {
  id: string;
  label: string;
  /** Which orbital ring this group maps to in the hero object. */
  tone: RingTone;
  items: Skill[];
};

export type Experience = {
  role: string;
  org: string;
  /** Free text, e.g. "Jun 2025 — Aug 2025" or "2 months". */
  period: string;
  bullets: string[];
};

export type Education = {
  school: string;
  program: string;
  period: string;
  gpa?: string;
};

export type Project = {
  title: string;
  problem: string;
  role: string;
  stack: string[];
  result?: string;
  github?: string;
  demo?: string;
  image?: string;
};

export type Certificate = {
  name: string;
  issuer: string;
  year: string;
  url?: string;
  /** "certificate" (default) or "achievement" (award, competition, scholarship…). */
  kind?: "certificate" | "achievement";
};

export type Hobby = { label: string; Icon: IconComponent };

export type Social = { name: string; href: string; Icon: IconComponent };

/* ───────── Helpers ───────── */

export const has = <T,>(list?: readonly T[] | null): list is readonly T[] => !!list && list.length > 0;
export const filled = (value?: string | null): value is string => !!value && value.trim().length > 0;

/* ───────── Content ─────────
 * Markers (the build prints a warning while any remain):
 *   SAMPLE         → placeholder written for layout, NOT a real fact. Replace or delete before publishing.
 *   TODO(content)  → missing real data.
 */

export const site = {
  name: "Đặng Đăng Dương",
  /** Used in the navbar mark. */
  shortName: "Dương",
  /** Public URL once deployed — used for canonical / OG tags. */
  url: "https://portfolio-dang-dang-duong.vercel.app",
  role: "Frontend & AI Engineer",
  /** Shown under the role; also the label of the orbit core. */
  focus: "Information Computer Engineering student · VNU-IS",
  tagline: "I build interfaces that think — clean frontend craft meeting practical AI.", // SAMPLE
  availability: "Open to AI Engineering & design roles",
  location: "Ninh Bình, Việt Nam",
  timezone: "UTC+7",
  /** IANA zone for the live local clock in the hero. Empty → clock hidden. */
  timeZone: "Asia/Ho_Chi_Minh",
  /** Approximate coordinates of Ninh Bình city. */
  coords: "20.25°N · 105.97°E",
  email: "dangduong17092005@gmail.com",
  altEmail: "23070004@vnu.edu.vn",
  /** Empty → CV buttons hidden. Put the PDF in /public and set e.g. "/cv-dang-dang-duong.pdf". */
  cvUrl: "",
};

export const about = {
  // SAMPLE — whole bio
  bio: [
    "I'm an Information Computer Engineering student at VNU International School who likes the moment where a model's output becomes something a person can actually use.",
    "Most of my time goes into frontend engineering — React, TypeScript and motion that explains rather than decorates — and into learning how to put machine learning behind those interfaces responsibly.",
    "Off-screen I climb, train and explore; all three taught me the same thing about engineering: pick a route, commit, adjust on the wall.",
  ],
  research: ["Artificial Intelligence", "Website & interface design"],
  hobbies: [
    { label: "Workout", Icon: Dumbbell },
    { label: "Climbing", Icon: Mountain },
    { label: "Movies", Icon: Film },
    { label: "Exploring", Icon: Compass },
  ] satisfies Hobby[],
};

/** Order matters: index 0 is the innermost ring. */
export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    label: "Frontend",
    tone: "cyan",
    // SAMPLE — skill list
    items: [
      { name: "React" },
      { name: "TypeScript" },
      { name: "Next.js" },
      { name: "Tailwind CSS" },
      { name: "Three.js" },
      { name: "HTML & CSS" },
    ],
  },
  {
    id: "ai",
    label: "AI / Data",
    tone: "violet",
    // SAMPLE — skill list
    items: [
      { name: "Python" },
      { name: "PyTorch" },
      { name: "scikit-learn" },
      { name: "Pandas & NumPy" },
      { name: "OpenCV" },
      { name: "Vercel AI SDK" },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    tone: "gray",
    // SAMPLE — skill list
    items: [
      { name: "Node.js" },
      { name: "Express" },
      { name: "FastAPI" },
      { name: "PostgreSQL" },
      { name: "Supabase" },
    ],
  },
  {
    id: "languages",
    label: "Languages & tools",
    tone: "dotted",
    items: [
      { name: "English (B2 · Aptis)" },
      { name: "Vietnamese (native)" },
      { name: "Git & GitHub" }, // SAMPLE
      { name: "Figma" }, // SAMPLE
      { name: "Docker" }, // SAMPLE
    ],
  },
];

// SAMPLE — invented to preview the layout (no real work experience yet). Delete the entry to hide the lane.
export const experience: Experience[] = [
  {
    role: "Frontend Developer Intern", // SAMPLE
    org: "CCMM", // SAMPLE
    period: "Jul 2025 — Aug 2025", // SAMPLE
    // SAMPLE — bullets
    bullets: [
      "Built and shipped reusable UI components for an internal web app in React and TypeScript.",
      "Turned design mock-ups into responsive pages and fixed layout bugs reported by the team.",
      "Worked in a Git flow with code review, learning to break features into small, reviewable changes.",
    ],
  },
];

export const education: Education[] = [
  {
    school: "International School, Vietnam National University, Hanoi (VNU-IS)",
    program: "Information Computer Engineering",
    period: "2023 — 2027",
    gpa: "3.0 / 4",
  },
];

/** Projects = the satellites of the orbit. The first one gets the highlighted "lead" card. */
export const projects: Project[] = [
  {
    title: "GoalPulse AI",
    problem:
      "A habit and goal tracker that grows like a garden: every habit is a 3D plant, and an AI coach reads your real progress and can act on it.",
    role: "Solo · full-stack & AI",
    stack: ["Next.js", "TypeScript", "Supabase", "React Three Fiber", "Vercel AI SDK"],
    result: "Live app: 3D habit garden, AI coach with undoable tool calls, 365-day analytics computed in SQL, RLS on every table.",
    github: "https://github.com/Duong-cinn/Goalpulse-ai",
    demo: "https://goalpulse-ai.vercel.app",
    image: "/projects/goalpulse.jpg",
  },
  {
    title: "Digital Orbit Portfolio",
    problem: "This site: a scroll-driven 3D story where the ship, planets and data sea frame real content instead of decorating it.",
    role: "Design & development",
    stack: ["React", "TypeScript", "Three.js", "Tailwind", "Lenis"],
    result: "Initial JS ≈ 74 kB gzip; the 3D scene loads lazily after first paint, with a CSS backdrop as fallback.",
    github: "https://github.com/Duong-cinn/PortfolioDangDangDuong",
    demo: "https://portfolio-dang-dang-duong.vercel.app",
    image: "/projects/digital-orbit.jpg",
  },
  {
    title: "Study Buddy AI", // SAMPLE
    problem: "Students lose time searching long lecture PDFs for the one paragraph they need.",
    role: "Full-stack & ML",
    stack: ["Python", "FastAPI", "PyTorch", "React"],
    result: "Semantic search over course notes with cited answers.", // SAMPLE
  },
  {
    title: "FormCheck", // SAMPLE
    problem: "Training alone at the gym, it's hard to know whether a squat or push-up rep is actually clean.",
    role: "Computer vision & frontend",
    stack: ["Python", "OpenCV", "PyTorch", "TypeScript"],
    result: "Counts reps from a webcam and flags shallow depth in real time.", // SAMPLE
  },
];

export const certificates: Certificate[] = [
  { name: "English — CEFR B2 (Aptis)", issuer: "British Council", year: "2024" },
  { name: "Student project showcase — finalist", issuer: "VNU International School", year: "2025", kind: "achievement" }, // SAMPLE
];

/**
 * About → cockpit HUD stats. Each kind draws its own mini instrument:
 *  progress → year track with a "now" marker · gauge → arc · scale → CEFR-style ladder · location → radar.
 */
export type Stat =
  | { kind: "progress"; label: string; value: string; caption: string; from: number; to: number }
  | { kind: "gauge"; label: string; value: number; max: number; caption: string }
  | { kind: "scale"; label: string; value: string; steps: string[]; caption: string }
  | { kind: "location"; label: string; value: string; caption: string };

export const stats: Stat[] = [
  { kind: "progress", label: "Education", value: "2027", caption: "Information Computer Engineering · VNU-IS", from: 2023, to: 2027 },
  { kind: "gauge", label: "GPA", value: 3.0, max: 4, caption: "on a 4-point scale" },
  { kind: "scale", label: "English", value: "B2", steps: ["A1", "A2", "B1", "B2", "C1", "C2"], caption: "Aptis · British Council 2024" },
  { kind: "location", label: "Base", value: "Ninh Bình", caption: "Việt Nam · UTC+7" },
];

/** Big statement at the top of About. `*word*` → serif italic, `[words]` → accent gradient. */
export const statement = "I build interfaces that *think* — [clean frontend craft] meeting practical AI."; // SAMPLE

/** "How I work" strip under the projects (lead-in is bold). */
// SAMPLE — working-style copy
export const process: { lead: string; body: string }[] = [
  { lead: "Understand the problem first.", body: "Talk to the people who feel it, then write the smallest spec that could work." },
  { lead: "Prototype in the browser.", body: "Real data, real motion, early — design decisions are cheaper when you can click them." },
  { lead: "Ship, measure, refine.", body: "Small reviewable changes, a performance budget, and a second pass on the details." },
];

/** Dev-console "Where my time goes" bars (percent, should sum to ~100). */
// SAMPLE — rough split, adjust to taste
export const focus: { label: string; value: number }[] = [
  { label: "Frontend engineering", value: 40 },
  { label: "Machine learning", value: 25 },
  { label: "UI & motion design", value: 18 },
  { label: "Backend & APIs", value: 12 },
  { label: "Writing & docs", value: 5 },
];

export const socials: Social[] = [
  { name: "Email", href: `mailto:${site.email}`, Icon: Mail },
  { name: "GitHub", href: "https://github.com/Duong-cinn", Icon: Github },
  // LinkedIn: add { name: "LinkedIn", href: "https://www.linkedin.com/in/…", Icon: Linkedin } when ready
];
