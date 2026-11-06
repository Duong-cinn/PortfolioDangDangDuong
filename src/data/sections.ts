import { about, has, projects, skillGroups } from "./config";

export type SectionId = "about" | "skills" | "projects" | "contact";

export type SectionMeta = { id: SectionId; label: string; visible: boolean };

/**
 * Page order + visibility. A section whose data is empty is not rendered
 * and does not appear in the navigation.
 * (Trajectory = Experience + Education and Certificates arrive in Phase 3.)
 */
export const sections: SectionMeta[] = [
  { id: "about", label: "About", visible: has(about.bio) || has(about.research) || has(about.hobbies) },
  { id: "skills", label: "Skills", visible: skillGroups.some((g) => has(g.items)) },
  { id: "projects", label: "Work", visible: has(projects) },
  { id: "contact", label: "Contact", visible: true },
];

export const visibleSections = sections.filter((s) => s.visible);

/** "01", "02"… based on visible order. */
export const sectionIndex = (id: SectionId) =>
  String(visibleSections.findIndex((s) => s.id === id) + 1).padStart(2, "0");
