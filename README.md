# Digital Orbit — Đặng Đăng Dương

Personal portfolio of **Đặng Đăng Dương**, Frontend & AI engineer (Information Computer Engineering, VNU-IS · Ninh Bình, Việt Nam).

The hero is an interactive 3D object generated from real content: **the core is the main specialty, each ring is a skill group, each node is a skill, each satellite is a project**. The section break is a Tràng An karst skyline over water.

![Digital Orbit social card](./public/og.png)

## Highlights

- **Scroll storytelling over one fixed WebGL scene** (vanilla three.js, lazy chunk): a procedural crystal **spaceship** flies between one pose per section (eased, banks with scroll velocity), over a perspective **data sea** of points — the pointer leaves ripples, a click sends a wave — and a star field that stretches into **warp streaks** while you scroll fast.
- **Three backdrop chapters** crossfade with scroll: deep-space dawn with a HUD grid (hero) → violet (reading sections) → night over a Tràng An karst skyline (contact + footer). Pure CSS, so it is also the no-WebGL fallback.
- **Sections**: hero with masked name entrance (Web Animations timeline) and a telemetry readout · About statement + stats + glass cards · Skills as an interactive **dev console** (filter by group, sparklines/bars draw in, projects that don't use the group dim; tilts upright in 3D as it scrolls in) · Work with a **self-typing `profile.ts`**, tilt + glare project cards and a "how I work" strip · Journey as an ascending **staircase of holds** joined by a rope that draws with scroll · Contact CTA + footer wordmark.
- **Micro-interactions**: magnetic buttons (label leans further for depth), shine sweep, click ripple, pointer spotlight on glass, Lenis smooth scrolling, `Ctrl/⌘ + K` command palette, live Ninh Bình clock.
- **Fallbacks**: reduced motion → no 3D, no Lenis, everything visible at once; slow devices step down DPR, then drop to the CSS backdrop; prerendered HTML is fully readable without JavaScript.

Initial JS ≈ 74 kB gzip (+ Lenis 6 kB, loaded after hydration); lazy 3D chunk ≈ 137 kB gzip, requested after load + idle. Lighthouse scores of the previous design no longer apply — re-measure on the deployed URL.

## Stack

React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS 3 · three.js · Lenis · Vitest. Self-hosted fonts: Inter Tight (latin + vietnamese), Instrument Serif italic, JetBrains Mono.

## Getting started

```bash
npm install
npm run dev        # http://localhost:8080
npm run qa         # typecheck + lint + tests + production build
npm run preview    # serve the production build
```

## Editing content

Everything lives in **[`src/data/config.ts`](src/data/config.ts)**: site info, bio, skill groups, experience, education, projects, certificates and socials.

- **Markers.** `// SAMPLE` marks placeholder text written for layout; it is **not real**. `// TODO(content)` marks missing data. `npm run build` prints a warning while any marker remains, so placeholder content is never published by accident.
- **Empty means hidden.** An empty string or empty list hides the matching UI. For example `projects: []` removes the Work section and its nav item. `cvUrl: ""` hides the CV buttons.
- **The orbit follows the data.** `skillGroups` order = ring order, innermost first. `tone` picks the ring color (`cyan`, `violet`, `gray`, `dotted`). Each item becomes a node. Each project becomes a satellite (max 5).
- **Brand icons (optional).** Add `Icon: SiReact` (from `react-icons/si`) to a skill. Each logo costs about 0.9 kB gzip.
- **CV.** Put the PDF in `public/` and set `site.cvUrl`, e.g. `"/cv-dang-dang-duong.pdf"`.
- **Domain.** Set `site.url` (e.g. `"https://dangduong.dev"`) to emit the canonical URL, `og:url`, `sitemap.xml` and the `robots.txt` Sitemap line at build time.

After changing the name, role, skill groups or projects, regenerate the social card and touch icon:

```bash
npm run og         # → public/og.png (1200×630) + public/apple-touch-icon.png  (needs local Chrome/Edge)
```

## Scripts

| Script | What it does |
|---|---|
| `dev` | Vite dev server |
| `build` | Client build → SSR build of `src/entry-server.tsx` → `scripts/prerender.mjs` (injects HTML, JSON-LD, font preloads, sitemap) |
| `preview` | Serve `dist/` |
| `typecheck` | `tsc` for app + node configs |
| `lint` | ESLint |
| `test` | Vitest (content rules, prerender/SEO, navbar a11y) |
| `qa` | All of the above in order |
| `og` | Render the social card + touch icon from `og.html` |

QA URL flags: `?static` forces the SVG fallback; `?hq` disables automatic quality downgrades (for testing only).

## Deploy

Any static host works. The output is `dist/`.

- **Vercel** (configured): import the GitHub repo at vercel.com/new — [`vercel.json`](vercel.json) already sets the build, output, immutable caching for `/assets/*` and basic security headers. After the first deploy, put the URL in `site.url` and push again.
- **Netlify**: build `npm run build`, publish `dist`.

`public/404.html` is served for unknown paths by both.

## Project structure

```
src/
├─ data/config.ts        # all personal content (edit me)
├─ data/sections.ts      # section order + hide-when-empty rules
├─ components/           # Navbar, Hero, About, Skills, Trajectory, Projects, Certificates, Contact, Footer, KarstDivider,
│                        # CommandPalette, LocalTime
├─ components/hero/      # OrbitFallback (static SVG orbit)
├─ three/spaceScene.ts   # the lazy three.js scene (ship, data sea, warp stars)
├─ three/poses.ts        # ship pose per section (desktop + phone)
├─ hooks/                # useOrbitScene, useReveal, useActiveSection, useTilt
├─ og/                   # social card + touch icon (dev-only page)
├─ entry-server.tsx      # prerender entry
└─ index.css             # design tokens (CSS variables) + motion
scripts/                 # prerender.mjs, generate-og.mjs
docs/                    # PHASE0_REPORT.md (design audit), QA_CHECKLIST.md
```

## Credits & license

Started from the MIT-licensed [Minimal Mono portfolio template](https://github.com/Nekoomaruu/modern-portofolio-template) by Nekomaru, then redesigned and rebuilt as Digital Orbit. Fonts are under the SIL Open Font License; optional brand logos come from Simple Icons via `react-icons`.

[MIT](./LICENSE)
