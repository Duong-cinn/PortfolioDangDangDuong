/**
 * Renders og.html (the social card: real WebGL scene + text from src/data/config.ts) to public/og.png,
 * and og.html?icon to public/apple-touch-icon.png.
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
  const shoot = (target, size, file) =>
    new Promise((done, fail) => {
      const p = spawn(
        chrome,
        [
          "--headless=new",
          // software WebGL so the real 3D scene renders without a GPU
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
          "--ignore-gpu-blocklist",
          "--hide-scrollbars",
          "--force-device-scale-factor=1",
          `--user-data-dir=${profile}`,
          `--window-size=${size}`,
          "--virtual-time-budget=9000",
          `--screenshot=${file}`,
          target,
        ],
        { stdio: "ignore" },
      );
      p.on("exit", (code) => (code === 0 ? done() : fail(new Error(`Chrome exited with ${code}`))));
      p.on("error", fail);
    });
  await shoot(`${url}?keep3d`, "1200,630", out);
  await shoot(`${url}?icon`, "180,180", join(root, "public", "apple-touch-icon.png"));
  console.log(`✓ ${out}
✓ public/apple-touch-icon.png`);
} finally {
  await server.close();
  rmSync(profile, { recursive: true, force: true });
}
