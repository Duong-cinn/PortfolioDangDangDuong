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
  url: "", // TODO(content): set after the first Vercel deploy
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

// SAMPLE — every project below is a placeholder. Links are left empty on purpose (no dead links).
export const projects: Project[] = [
  {
    title: "Digital Orbit Portfolio",
    problem: "A personal site where the hero object is generated from my real skill data instead of decoration.",
    role: "Design & development",
    stack: ["React", "TypeScript", "Three.js", "Tailwind"],
    result: "Initial JS ≈ 73 kB gzip; the 3D scene loads lazily and falls back to a static SVG.",
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
  {
    title: "Route Log", // SAMPLE
    problem: "Climbers track sessions in notes apps and can't see progress over time.",
    role: "Frontend",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
  },
];

export const certificates: Certificate[] = [
  { name: "English — CEFR B2 (Aptis)", issuer: "British Council", year: "2024" },
  { name: "Student project showcase — finalist", issuer: "VNU International School", year: "2025", kind: "achievement" }, // SAMPLE
];

export const socials: Social[] = [
  { name: "Email", href: `mailto:${site.email}`, Icon: Mail },
  { name: "GitHub", href: "https://github.com/Duong-cinn", Icon: Github },
  // LinkedIn: add { name: "LinkedIn", href: "https://www.linkedin.com/in/…", Icon: Linkedin } when ready
];
