import { about, certificates, education, experience, has, projects, skillGroups } from "./config";

export type SectionId = "about" | "skills" | "trajectory" | "projects" | "certificates" | "contact";

export type SectionMeta = { id: SectionId; label: string; visible: boolean };

/**
 * Page order + visibility. A section whose data is empty is not rendered
 * and does not appear in the navigation.
 */
export const sections: SectionMeta[] = [
  { id: "about", label: "About", visible: has(about.bio) || has(about.research) || has(about.hobbies) },
  { id: "skills", label: "Skills", visible: skillGroups.some((g) => has(g.items)) },
  { id: "trajectory", label: "Journey", visible: has(experience) || has(education) },
  { id: "projects", label: "Work", visible: has(projects) },
  { id: "certificates", label: "Proof", visible: has(certificates) },
  { id: "contact", label: "Contact", visible: true },
];

export const visibleSections = sections.filter((s) => s.visible);

/** "01", "02"… based on visible order. */
export const sectionIndex = (id: SectionId) =>
  String(visibleSections.findIndex((s) => s.id === id) + 1).padStart(2, "0");
