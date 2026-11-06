import type { ComponentType } from "react";
import { Compass, Dumbbell, Film, Mail, Mountain } from "lucide-react";

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

/* ───────── Content ───────── */

export const site = {
  name: "Đặng Đăng Dương",
  /** Used in the navbar mark. */
  shortName: "Dương",
  /** Public URL once deployed — used for canonical / OG tags. TODO(content) */
  url: "",
  role: "Frontend & AI Engineer",
  /** Shown under the role; also the label of the orbit core. */
  focus: "Information Computer Engineering student · VNU-IS", // TODO(content): confirm official English program name
  tagline: "", // TODO(content): one-line personal tagline
  availability: "Open to AI Engineering & design roles",
  location: "Ninh Bình, Việt Nam",
  timezone: "UTC+7",
  /** Approximate coordinates of Ninh Bình city. TODO(content): confirm. */
  coords: "20.25°N · 105.97°E",
  email: "dangduong17092005@gmail.com",
  altEmail: "23070004@vnu.edu.vn",
  cvUrl: "", // TODO(content): put the real PDF in /public and set e.g. "/cv-dang-dang-duong.pdf"
};

export const about = {
  bio: [] as string[], // TODO(content): 3–5 sentence bio
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
  { id: "frontend", label: "Frontend", tone: "cyan", items: [] }, // TODO(content): e.g. React, TypeScript…
  { id: "ai", label: "AI / Data", tone: "violet", items: [] }, // TODO(content)
  { id: "backend", label: "Backend", tone: "gray", items: [] }, // TODO(content)
  { id: "languages", label: "Languages", tone: "dotted", items: [{ name: "English (B2)" }] },
];

export const experience: Experience[] = [
  {
    role: "Developer", // TODO(content): exact role title
    org: "CCMM", // TODO(content): full organization name
    period: "2 months", // TODO(content): month/year range
    bullets: [], // TODO(content): 2–3 impact bullets
  },
];

export const education: Education[] = [
  {
    school: "VNU International School (VNU-IS)", // TODO(content): confirm official name
    program: "Information Computer Engineering",
    period: "2023 — 2027",
    gpa: "3.0", // TODO(content): confirm scale (/4?)
  },
];

export const projects: Project[] = []; // TODO(content): 3–5 featured projects

export const certificates: Certificate[] = []; // TODO(content): e.g. English B2 certificate, awards (kind: "achievement")

export const socials: Social[] = [
  { name: "Email", href: `mailto:${site.email}`, Icon: Mail },
  // TODO(content): GitHub, LinkedIn
];
