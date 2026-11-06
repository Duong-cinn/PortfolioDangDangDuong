/**
 * Runs after `vite build` + `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
 * Injects the rendered app, head tags (canonical, JSON-LD) and font preloads into dist/index.html,
 * writes sitemap.xml / robots.txt Sitemap line when site.url is set, then removes dist-ssr.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const ssrDir = join(root, "dist-ssr");

const ssr = await import(pathToFileURL(join(ssrDir, "entry-server.js")).href);
const indexPath = join(dist, "index.html");
let html = readFileSync(indexPath, "utf8");

if (!html.includes("<!--app-->") || !html.includes("<!--head-->")) {
  throw new Error("dist/index.html is missing the <!--app--> or <!--head--> placeholder");
}

// Preload the display font (the h1 / LCP element) — latin + vietnamese subsets only.
const assets = readdirSync(join(dist, "assets"));
const preloads = assets
  .filter((f) => /^space-grotesk-(latin|vietnamese)-wght-normal-.*\.woff2$/.test(f))
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`);

const appHtml = ssr.render();
html = html.replace("<!--app-->", appHtml).replace("<!--head-->", [...preloads, ssr.headTags()].join("\n    "));
writeFileSync(indexPath, html);

if (ssr.siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${ssr.siteUrl}/</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
  );
  const robotsPath = join(dist, "robots.txt");
  const robots = existsSync(robotsPath) ? readFileSync(robotsPath, "utf8") : "User-agent: *\nAllow: /\n";
  if (!robots.includes("Sitemap:")) writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${ssr.siteUrl}/sitemap.xml\n`);
}

rmSync(ssrDir, { recursive: true, force: true });
console.log(`✓ prerendered ${(appHtml.length / 1024).toFixed(1)} kB of HTML, ${preloads.length} font preload(s)${ssr.siteUrl ? ", sitemap.xml" : ""}`);
