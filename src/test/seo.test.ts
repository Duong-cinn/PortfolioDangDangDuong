import { describe, expect, it } from "vitest";
import { headTags, render } from "@/entry-server";
import { site } from "@/data/config";

describe("prerender entry", () => {
  it("renders the h1 with the real name into static HTML", () => {
    const html = render();
    expect(html).toContain(`id="hero-title"`);
    expect(html).toContain(site.name);
  });

  it("emits valid Person JSON-LD that cannot break out of its script tag", () => {
    const tags = headTags();
    const json = tags.match(/<script type="application\/ld\+json">(.*)<\/script>/)?.[1];
    expect(json).toBeTruthy();
    expect(json).not.toContain("</");
    const data = JSON.parse(json!);
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe(site.name);
    expect(data.jobTitle).toBe(site.role);
  });

  it("only emits canonical / og:url when site.url is configured", () => {
    const tags = headTags();
    if (site.url) expect(tags).toContain('rel="canonical"');
    else expect(tags).not.toContain('rel="canonical"');
  });
});
