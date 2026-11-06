import * as config from "./config";
import { has } from "./config";

export type SectionId = "about" | "skills" | "trajectory" | "projects" | "certificates" | "contact";

export type SectionMeta = { id: SectionId; label: string; visible: boolean };

type ContentShape = Pick<typeof config, "about" | "skillGroups" | "experience" | "education" | "projects" | "certificates">;

/**
 * Page order + visibility. A section whose data is empty is not rendered
 * and does not appear in the navigation.
 */
export function buildSections(c: ContentShape): SectionMeta[] {
  return [
    { id: "about", label: "About", visible: has(c.about.bio) || has(c.about.research) || has(c.about.hobbies) },
    { id: "skills", label: "Skills", visible: c.skillGroups.some((g) => has(g.items)) },
    { id: "trajectory", label: "Journey", visible: has(c.experience) || has(c.education) },
    { id: "projects", label: "Work", visible: has(c.projects) },
    { id: "certificates", label: "Proof", visible: has(c.certificates) },
    { id: "contact", label: "Contact", visible: true },
  ];
}

export const sections = buildSections(config);

export const visibleSections = sections.filter((s) => s.visible);

/** "01", "02"… based on visible order. */
export const sectionIndex = (id: SectionId) =>
  String(visibleSections.findIndex((s) => s.id === id) + 1).padStart(2, "0");
