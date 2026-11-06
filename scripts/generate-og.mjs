/**
 * Renders og.html (the social card built from src/data/config.ts) to public/og.png.
 * Usage: npm run og      (re-run whenever name / role / skill groups / projects change)
 * Needs a local Chrome/Edge/Chromium. Override with CHROME_PATH=/path/to/chrome.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "vite";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "public", "og.png");

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser.");
  process.exit(1);
}

const server = await createServer({ root, logLevel: "error", server: { port: 5199, strictPort: false } });
await server.listen();
const url = `${server.resolvedUrls.local[0].replace(/\/$/, "")}/og.html`;
const profile = mkdtempSync(join(tmpdir(), "og-chrome-"));

try {
  await new Promise((done, fail) => {
    const p = spawn(
      chrome,
      [
        "--headless=new",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--user-data-dir=${profile}`,
        "--window-size=1200,630",
        "--virtual-time-budget=6000",
        `--screenshot=${out}`,
        url,
      ],
      { stdio: "ignore" },
    );
    p.on("exit", (code) => (code === 0 ? done() : fail(new Error(`Chrome exited with ${code}`))));
    p.on("error", fail);
  });
  console.log(`✓ ${out}`);
} finally {
  await server.close();
  rmSync(profile, { recursive: true, force: true });
}
