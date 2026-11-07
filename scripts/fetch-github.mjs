/**
 * Build-time GitHub snapshot → src/data/github.json (public data only).
 * Language share is by bytes across public, non-fork repos.
 * Never fails the build: on any error the previous snapshot is kept.
 * Optional: GITHUB_TOKEN raises the API rate limit.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "src", "data", "github.json");
const config = readFileSync(join(root, "src", "data", "config.ts"), "utf8");
const user = config.match(/github\.com\/([A-Za-z0-9-]+)/)?.[1];

const headers = { Accept: "application/vnd.github+json", "User-Agent": "digital-orbit-portfolio-build" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const get = async (url) => {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

try {
  if (!user) throw new Error("no github.com/<user> link in config.ts");
  const profile = await get(`https://api.github.com/users/${user}`);
  const repos = (await get(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`)).filter((r) => !r.fork);
  const bytes = {};
  for (const r of repos) {
    const langs = await get(r.languages_url);
    for (const [k, v] of Object.entries(langs)) bytes[k] = (bytes[k] ?? 0) + v;
  }
  const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 5).map(([name, b]) => ({ name, pct: Math.round((b / total) * 1000) / 10 }));
  const rest = sorted.slice(5).reduce((a, [, b]) => a + b, 0);
  if (rest > 0) top.push({ name: "Other", pct: Math.round((rest / total) * 1000) / 10 });
  const last = repos[0];

  const snapshot = {
    user,
    fetchedAt: new Date().toISOString(),
    publicRepos: profile.public_repos,
    since: profile.created_at,
    languages: top,
    lastPush: last ? { repo: last.name, at: last.pushed_at } : null,
  };
  writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`✓ github snapshot: ${repos.length} repos, ${top.map((l) => `${l.name} ${l.pct}%`).join(", ")}`);
} catch (err) {
  console.warn(`⚠ github snapshot skipped (${err.message}) — keeping the previous src/data/github.json`);
}
