/**
 * Build-time prerender entry (see scripts/prerender.mjs).
 * Produces the full page HTML + head tags so content is readable without JS,
 * the h1 paints from HTML (fast LCP) and crawlers see everything.
 */
import { renderToString } from "react-dom/server";
import App from "./App";
import { about, education, filled, has, site, skillGroups, socials } from "./data/config";

export function render() {
  return renderToString(<App />);
}

export const siteUrl = site.url.replace(/\/$/, "");

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

export function headTags() {
  const tags: string[] = [];
  if (filled(siteUrl)) {
    tags.push(`<link rel="canonical" href="${escapeAttr(siteUrl)}/" />`);
    tags.push(`<meta property="og:url" content="${escapeAttr(siteUrl)}/" />`);
  }

  const sameAs = socials.filter((s) => !s.href.startsWith("mailto:")).map((s) => s.href);
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    email: `mailto:${site.email}`,
    ...(filled(siteUrl) && { url: `${siteUrl}/` }),
    address: { "@type": "PostalAddress", addressLocality: site.location.split(",")[0], addressCountry: "VN" },
    ...(has(education) && {
      alumniOf: education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
    }),
    knowsAbout: [...about.research, ...skillGroups.flatMap((g) => g.items.map((i) => i.name))],
    ...(has(sameAs) && { sameAs }),
  };
  // `<` escaped so the JSON can never close the script tag.
  tags.push(`<script type="application/ld+json">${JSON.stringify(person).replace(/</g, "\\u003c")}</script>`);
  return tags.join("\n    ");
}
