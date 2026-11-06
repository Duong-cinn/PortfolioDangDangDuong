import { describe, expect, it } from "vitest";
import * as config from "@/data/config";
import { filled, has } from "@/data/config";
import { buildSections } from "@/data/sections";
import { hasFeaturedProject } from "@/lib/layout";

const empty = {
  about: { bio: [], research: [], hobbies: [] },
  skillGroups: [{ id: "frontend", label: "Frontend", tone: "cyan" as const, items: [] }],
  experience: [],
  education: [],
  projects: [],
  certificates: [],
};

const visibleIds = (c: Parameters<typeof buildSections>[0]) =>
  buildSections(c)
    .filter((s) => s.visible)
    .map((s) => s.id);

describe("helpers", () => {
  it("has() is true only for non-empty lists", () => {
    expect(has([])).toBe(false);
    expect(has(undefined)).toBe(false);
    expect(has(null)).toBe(false);
    expect(has([1])).toBe(true);
  });

  it("filled() ignores whitespace-only strings", () => {
    expect(filled("")).toBe(false);
    expect(filled("   ")).toBe(false);
    expect(filled(undefined)).toBe(false);
    expect(filled("x")).toBe(true);
  });
});

describe("hide-when-empty sections", () => {
  it("shows only Contact when there is no content", () => {
    expect(visibleIds(empty)).toEqual(["contact"]);
  });

  it("shows Skills only when at least one group has items", () => {
    const withSkill = { ...empty, skillGroups: [{ ...empty.skillGroups[0], items: [{ name: "React" }] }] };
    expect(visibleIds(withSkill)).toContain("skills");
  });

  it("shows Trajectory for experience or education alone", () => {
    const edu = { ...empty, education: [{ school: "S", program: "P", period: "2023" }] };
    expect(visibleIds(edu)).toContain("trajectory");
    const exp = { ...empty, experience: [{ role: "R", org: "O", period: "1m", bullets: [] }] };
    expect(visibleIds(exp)).toContain("trajectory");
  });

  it("keeps a stable section order", () => {
    expect(buildSections(config).map((s) => s.id)).toEqual(["about", "skills", "trajectory", "projects", "certificates", "contact"]);
  });
});

describe("projects grid", () => {
  it("features the first card only when it fills the 3-column grid", () => {
    expect([1, 2, 3, 4, 5, 6, 8].map(hasFeaturedProject)).toEqual([false, true, false, false, true, false, true]);
  });
});

describe("content sanity", () => {
  it("every skill group uses a known ring tone and unique id", () => {
    const ids = config.skillGroups.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of config.skillGroups) expect(["cyan", "violet", "gray", "dotted"]).toContain(g.tone);
  });

  it("never renders the literal TODO marker as visible text", () => {
    const visibleStrings = JSON.stringify({
      site: config.site,
      about: { bio: config.about.bio, research: config.about.research },
      experience: config.experience,
      education: config.education,
      projects: config.projects,
      certificates: config.certificates,
    });
    expect(visibleStrings).not.toMatch(/TODO|SAMPLE/);
  });
});
