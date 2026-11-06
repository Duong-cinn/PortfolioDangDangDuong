# PHASE 0 — AUDIT & CREATIVE DESIGN DISCOVERY
## DIGITAL ORBIT — CREATIVE ENGINEERING · Đặng Đăng Dương

> Ngày audit: 2026-11-06 · Phạm vi: `C:\modern-portofolio-template-main` · Chế độ: **read-only**
> Ghi chú về thao tác: đã chạy `npm run build` (vì `node_modules` đã có sẵn). Lệnh này tạo thư mục `dist/` (đã nằm trong `.gitignore`). Ngoài file này ra, không có file nguồn nào bị sửa.
> Ký hiệu: **UNVERIFIED** = chưa kiểm chứng được, chỉ là ước lượng hoặc chưa truy cập được nguồn.

---

## A. BÁO CÁO AUDIT DỰ ÁN

### A.0 Thông tin nền đã kiểm chứng

| Hạng mục | Kết quả | Nguồn |
|---|---|---|
| Framework | React 18.3 + Vite 5.4.19 (`@vitejs/plugin-react-swc`) | `package.json`, `npx vite --version` |
| Ngôn ngữ | TypeScript 5.8, **strict: false**, `noImplicitAny: false`, `strictNullChecks: false` | `tsconfig.app.json:19-23`, `tsconfig.json:8-13` |
| Tailwind | **v3** (3.4.17), config JS-first `tailwind.config.ts` + PostCSS (`postcss.config.js`) — không phải v4 CSS-first | `package.json`, `tailwind.config.ts` |
| UI kit | shadcn/ui (style `default`, baseColor `slate`, CSS variables) | `components.json` |
| Lockfile | **Có cả hai**: `bun.lock` và `package-lock.json` → nguồn gây lệch phiên bản | thư mục gốc |
| Routing | `react-router-dom` v6, 2 route: `/` và `*` | `src/App.tsx:17-21` |
| Git | Thư mục **không phải** git repo (`git status` → `fatal: not a git repository`) | — |
| Node | v26.13.0 | `node -v` |
| Test | Có script `vitest` nhưng **không có file test nào** và không có `test` config trong `vite.config.ts` | — |
| License template | MIT, © 2026 Nekomaru → được phép sửa/thương mại, nên giữ file `LICENSE` | `LICENSE` |

### A.1 Kiến trúc & luồng dữ liệu

```
index.html ──> src/main.tsx ──> App.tsx (QueryClientProvider › TooltipProvider › Toaster ×2 › BrowserRouter)
                                    └─ pages/Index.tsx  (gọi useReveal() một lần)
                                         ├─ Navbar   ← nav, site
                                         ├─ Hero     ← site
                                         ├─ Projects ← projects
                                         ├─ Skills   ← skills
                                         ├─ About    ← about, site
                                         ├─ Contact  ← site (formspreeEndpoint, email)
                                         └─ Footer   ← socials, site
src/data/config.ts  = nguồn nội dung duy nhất (site, about, projects, skills, socials, nav)
```

- Luồng một chiều, import tĩnh từ `src/data/config.ts` → component. Không có state toàn cục, không fetch dữ liệu.
- `QueryClientProvider` (`App.tsx:9,12`), `TooltipProvider`, `Toaster`, `Sonner` được mount nhưng **không component nào dùng** → tốn bundle vô ích.
- Schema `config.ts` quá đơn giản cho nhu cầu của bạn: không có `education`, `experience`, `certificates`, `research`, `skillGroups`, `hobbies`; `Skill` chỉ là `{ name, Icon }` (`config.ts:67`), không có nhóm.

### A.2 Design system hiện tại

- **Màu:** token HSL kiểu shadcn trong `src/index.css:7-67`, **hoàn toàn đơn sắc** (saturation 0%). Dark: `--background: 0 0% 6%`, `--muted-foreground: 0 0% 60%`. Không có accent màu nào.
- **Font:** Space Grotesk (heading) + Inter (body) qua Google Fonts (`index.html:21`), map trong `tailwind.config.ts:14-17`. Có `font-feature-settings: "ss01","cv11"` (`index.css:79`).
- **Spacing/container:** chỉ một utility `.container-mono` = `max-w-5xl mx-auto px-6 sm:px-8` (`index.css:99-101`). Không có scale riêng, không fluid type, cỡ chữ hard-code theo breakpoint (`text-4xl sm:text-5xl md:text-7xl`, `Hero.tsx:11`).
- **Radius:** `--radius: 0.5rem`. Không có token shadow/glow, motion (duration/easing), z-index.
- **Tương phản hiện tại (đã tính):** muted dark `#999` trên `#0F0F0F` = 6.73:1; light muted `#666` trên `#FAFAFA` = 5.5:1 → đạt AA.

### A.3 Hero hiện tại (`src/components/Hero.tsx`)

- Text thuần: dòng "Available for work" (hard-code, dòng 9) + chấm `animate-pulse`, `h1` tên + role, đoạn bio, 2 CTA (`#contact`, tải `site.cvUrl`).
- Không có hình ảnh, 3D, nền, hay hiệu ứng nào ngoài `.reveal`.
- **Lỗi tiềm ẩn cho LCP:** `h1` có class `reveal` → bắt đầu ở `opacity: 0` cho tới khi JS chạy IntersectionObserver. Phần tử `opacity: 0` không được tính là ứng viên LCP → LCP bị trễ theo thời gian tải JS.

### A.4 Scroll animation hiện tại

- Chỉ có `src/hooks/useReveal.ts`: chạy `querySelectorAll(".reveal")` **một lần** lúc mount, IO `threshold: 0.12`, `rootMargin: 0 0 -40px 0`, `unobserve` sau lần đầu. Có fallback khi không có IO (dòng 10-13).
- CSS trong `index.css:90-98`: `opacity 0 → 1`, `translateY(20px) → 0`, `0.7s ease-out`.
- **Thiếu:** không có stagger, không tôn trọng `prefers-reduced-motion`, phần tử render muộn sẽ không được observe, `html { scroll-behavior: smooth }` (`index.css:75`) không bị tắt khi reduced-motion.
- `tailwindcss-animate` + keyframe `fade-in` (`tailwind.config.ts:58-66`) được khai báo nhưng không dùng ở component portfolio nào.

### A.5 Responsive

- Breakpoint mặc định của Tailwind (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1400 cho container).
- **Không có menu mobile:** `Navbar.tsx:13` dùng `hidden md:flex` và không có nút hamburger → dưới 768px người dùng **không điều hướng được** bằng nav.
- Grid Projects `sm:2 / lg:3` cột, Skills `2 / sm:3 / md:5` cột — ổn.
- `src/hooks/use-mobile.tsx` tồn tại nhưng chỉ dùng trong `ui/sidebar.tsx` (không dùng thực tế).

### A.6 Component tái sử dụng được

| Component | Đánh giá |
|---|---|
| `SectionHeading.tsx` | Tốt, API gọn (`eyebrow/title/description`). Giữ, mở rộng thêm số thứ tự/"orbit index". |
| `ui/button.tsx`, `ui/badge.tsx`, `ui/card.tsx`, `lib/utils.ts (cn)` | Có thể dùng làm nền cho button/tag/card mới — nhưng hiện các component portfolio **không dùng** chúng, mà lặp class inline (ví dụ class nút ở `Hero.tsx:23`, `Hero.tsx:31`, `Contact.tsx:82`). |
| 45 file khác trong `src/components/ui/` | Không được import ở đâu ngoài `App.tsx` (toaster, sonner, tooltip). Là code chết. |
| `NavLink.tsx` | Không dùng. |
| `src/App.css` | **Không được import** (`main.tsx` chỉ import `index.css`). Code chết từ template Vite. |

### A.7 Dependency hỗ trợ animation/3D

- Đã kiểm tra: **không có** `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`/`motion`, `gsap`, `lenis`, `@splinetool/*` (`npm ls --depth=0` không có, `node_modules/three` không tồn tại).
- Có sẵn chỉ: `tailwindcss-animate`, IntersectionObserver tự viết, `embla-carousel-react` (không dùng), `recharts` (không dùng).

### A.8 Hạn chế kỹ thuật & tech debt

| # | Vấn đề | Bằng chứng |
|---|---|---|
| 1 | **Không có mobile nav** | `Navbar.tsx:13` |
| 2 | SPA thuần: nội dung chỉ xuất hiện sau khi JS chạy → **không đọc được khi tắt JS**, SEO phụ thuộc crawler chạy JS, LCP phụ thuộc bundle | `index.html:25` chỉ có `<div id="root">` |
| 3 | `.reveal` ẩn nội dung (opacity 0) nếu JS lỗi; áp lên cả `h1` | `index.css:90`, `Hero.tsx:11` |
| 4 | Form không có `<label>` (chỉ placeholder) → a11y; `focus:outline-none` + ring | `Contact.tsx:48-71` |
| 5 | Theme: `index.html` hard-code `class="dark"`, `useTheme` mới đổi sau mount → nháy (FOUC) nếu người dùng chọn light; `localStorage` không có try/catch | `index.html:2`, `useTheme.ts:9` |
| 6 | Meta/SEO toàn placeholder: title "Portfolio — Frontend Developer", author "Your Name", canonical `your-demo-url.example.com`, OG image là `placeholder.svg` (mạng xã hội không hỗ trợ SVG làm OG) | `index.html:6-17` |
| 7 | **Không có favicon** (README `:92,140` nói có `favicon.ico` nhưng thư mục `public/` không có) — README và code lệch nhau | `public/` |
| 8 | `cv.pdf` chỉ 548 byte = placeholder; `preview.jpg` 176 KB là ảnh demo của template | `public/` |
| 9 | Nội dung hard-code ngoài config: "Available for work" (`Hero.tsx:9`), "Open to opportunities" (`About.tsx:29`), các eyebrow/description của section, "Powered by Formspree" | — |
| 10 | Dependency thừa: react-query, ~25 gói Radix, recharts, date-fns, react-day-picker, zod, react-hook-form, cmdk, vaul, embla… | `package.json` |
| 11 | Lint: **3 error, 7 warning** (`ui/command.tsx:24`, `ui/textarea.tsx:5` no-empty-object-type; `tailwind.config.ts:69` `require()`) | `npx eslint .` |
| 12 | Type-check: `tsc --noEmit` **pass**, nhưng strict tắt nên ít giá trị bảo vệ | — |
| 13 | Hai lockfile (`bun.lock` + `package-lock.json`) | thư mục gốc |
| 14 | `caniuse-lite` cũ 17 tháng (cảnh báo khi build) | build log |
| 15 | `html lang="en"` cố định; tên có dấu tiếng Việt nên cần quyết định ngôn ngữ nội dung | `index.html:2` |
| 16 | `Footer` link social mở `target="_blank"` cả với `mailto:` | `Footer.tsx:16` |

### A.9 Keep / Refactor / Redesign / Remove

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Vite + React 18 + TS | **Keep** | Ổn định, build 4s. Bật dần `strict` ở Phase 1 cho file mới. |
| Tailwind v3 + token qua CSS variables | **Keep** (không nâng lên v4) | Nâng v4 là rủi ro không cần thiết; pattern token hiện tại đã đúng hướng. |
| `src/data/config.ts` | **Refactor** | Mở rộng schema có type (education, experience, skillGroups, certificates, research, hobbies, meta) + quy tắc "ẩn khi rỗng". |
| `index.css` tokens | **Redesign** | Thay bảng đơn sắc bằng hệ token Digital Orbit (mục 5). |
| `useReveal.ts` | **Refactor** | Thêm stagger, reduced-motion, gate bằng class `js`, observe phần tử mới. Không cần thư viện. |
| `SectionHeading.tsx` | **Keep + mở rộng** | API tốt. |
| `Hero.tsx` | **Redesign** | Thêm khu 3D lazy, placeholder SVG, layout grid mới. |
| `Navbar.tsx` | **Redesign** | Thêm mobile menu, active-section indicator, skip-link. |
| `Projects.tsx` | **Refactor** | Card mới + ẩn khi `projects.length === 0` (hiện bạn chưa có project). |
| `Skills.tsx` | **Redesign** | Nhóm theo "quỹ đạo", đồng bộ với các vòng 3D. |
| `About.tsx` | **Refactor** | Gộp Research Interests + sở thích. |
| `Contact.tsx` | **Refactor** | Thêm `<label>`, focus-visible, quyết định Formspree hay mailto. |
| `Footer.tsx` | **Keep + sửa nhỏ** | Bỏ `target=_blank` cho mailto. |
| `App.tsx` providers (Query, Tooltip, 2 Toaster) | **Remove** | Không được dùng; giảm bundle. |
| 45/48 file `components/ui/*` + dependency tương ứng | **Remove** (giữ `button`, `badge` nếu dùng lại) | Code chết. |
| `App.css`, `NavLink.tsx` | **Remove** | Không import ở đâu. |
| `bun.lock` | **Remove** (giữ `package-lock.json`) | Một package manager duy nhất. README dùng npm. |
| `index.html` meta | **Redesign** | SEO/OG thật, favicon, `lang`, theme-color. |
| `public/preview.jpg`, `placeholder.svg` | **Remove/Replace** | Ảnh của template; cần OG image 1200×630 riêng. |
| Light mode toggle | **Chờ bạn quyết** (câu hỏi Q3) | Thêm chi phí thiết kế cho mọi trạng thái 3D/glow. |

### A.10 Baseline hiện tại (đo thật)

```
dist/index.html                 1.41 kB │ gzip:   0.61 kB
dist/assets/index-RP2WgHgO.css 58.05 kB │ gzip:  10.26 kB
dist/assets/index-TA7OZUIU.js 334.58 kB │ gzip: 108.55 kB
✓ 1682 modules transformed · built in 4.00s
```

- Một chunk JS duy nhất 108.55 KB gzip cho một trang tĩnh gần như chỉ có text. Sau khi gỡ provider và dependency thừa, ước lượng còn ~65–75 KB gzip (**UNVERIFIED** — đo lại ở Phase 1).
- CSS 10.26 KB gzip — phần lớn là style của các component shadcn không dùng nhưng vẫn được Tailwind scan.
- Lighthouse: **chưa đo** (không chạy server/trình duyệt trong Phase 0) → **UNVERIFIED**. Rủi ro rõ nhất: LCP trễ vì `h1.reveal` opacity 0 + render phụ thuộc JS; font Google chặn render.

### A.11 Tóm tắt SWOT

- **Điểm mạnh:** cấu trúc nhỏ, dễ hiểu; một file config; build nhanh; token CSS variables sẵn sàng thay thế; license MIT.
- **Điểm yếu:** không có mobile nav; nội dung phụ thuộc JS; dependency thừa nhiều; schema nội dung nghèo; meta placeholder; a11y form.
- **Cơ hội:** bundle nền nhẹ sau khi dọn → còn rất nhiều "ngân sách" cho chunk 3D lazy; IO hiện có đủ cho reveal, không cần thêm thư viện animation.
- **Thách thức:** dữ liệu cá nhân hiện còn mỏng (chưa có project, chứng chỉ, bio) → thiết kế phải chịu được trạng thái ít nội dung mà không trông trống.

---

## B. DESIGN DIRECTION — Cách hiểu riêng về "Digital Orbit" cho bạn

### B.1 Concept statement

> **Digital Orbit** là bản đồ quỹ đạo của một kỹ sư đang hình thành: ở tâm là lõi **Frontend × AI** — nơi giao diện gặp trí tuệ máy; quanh nó là các vòng quỹ đạo, mỗi vòng là một nhóm kỹ năng thật của Dương, mỗi điểm sáng trên vòng là một kỹ năng cụ thể. Các dự án sẽ là những vệ tinh được "phóng" lên quỹ đạo khi hoàn thành — trang web lớn dần cùng sự nghiệp. Chất liệu thị giác lấy cảm hứng từ quê hương **Ninh Bình**: đường chuyển cảnh không phải sóng sin chung chung mà là đường sóng tan dần thành **dáng núi đá vôi karst**, cũng là thứ gợi đến sở thích leo núi và khám phá.

### B.2 Mood keywords
`precise` · `calm-electric` · `orbital` · `glass & graphite` · `limestone silhouette` · `quietly technical` · `human-made`

### B.3 Ánh xạ metaphor ↔ dữ liệu thật

| Phần tử 3D / UI | Đại diện cho | Trường config (đề xuất) |
|---|---|---|
| Lõi (core) kính-kim loại | Chuyên môn chính: "Frontend & AI" | `site.role`, `site.coreLabel` |
| Khung lưới icosahedron mờ bên trong lõi | AI / mạng nơ-ron — "trí tuệ bên trong giao diện" | cố định |
| Vòng 1 — cyan | Frontend | `skillGroups[0]` |
| Vòng 2 — violet | AI / Data | `skillGroups[1]` |
| Vòng 3 — cool gray | Backend | `skillGroups[2]` |
| Vòng chấm ngoài cùng (mỏng) | Ngôn ngữ & công cụ (English B2, Git…) | `skillGroups[3]` (tuỳ chọn) |
| Các điểm sáng (node) trên mỗi vòng | Từng kỹ năng trong nhóm (số node = số kỹ năng) | `skillGroups[i].items[]` |
| Vệ tinh (satellite) | Dự án nổi bật — **0 vệ tinh khi chưa có project** | `projects[]` |
| Một "sao chổi" đi qua 1 lần khi load | Kinh nghiệm CCMM (1 trải nghiệm thật) | `experience[]` |
| Nhãn toạ độ ở góc hero `20.25°N · 105.97°E` (ước lượng, **cần bạn xác nhận**) | Vị trí: Ninh Bình | `site.location`, `site.coords` |
| Wave → karst silhouette | Ninh Bình + leo núi + khám phá | static SVG |

**Micro-interaction:** hover/focus một vòng (desktop) hoặc chạm "chip" tên nhóm ngay dưới object (mobile) → vòng đó sáng lên, các vòng khác mờ, hiện nhãn DOM (có thể đọc bằng screen reader) "Frontend · 5 skills". Click → cuộn mượt tới Skills với nhóm đó được highlight. Danh sách chip là **DOM thật**, 3D chỉ là biểu diễn → không mất thông tin khi tắt WebGL.

### B.4 Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Text luôn là lớp đọc được đầu tiên; 3D nằm cạnh, không nằm dưới chữ | Đặt object sau chữ trên mobile làm giảm tương phản |
| Cyan chỉ cho phần tử tương tác/primary | Glow neon khắp nơi, gradient cầu vồng |
| Một khoảnh khắc "wow" duy nhất: object hero | Mỗi section một hiệu ứng 3D riêng |
| Scroll native, reveal ngắn (≤ 700ms) | Scroll-jacking, snap toàn trang, loading screen |
| Ẩn section rỗng | Hiện section "Coming soon" trống |
| Dùng chi tiết thật (karst, toạ độ, kỹ năng thật) | Bịa số liệu, bịa project, đếm "years of experience" |

---

## C. BA BIẾN THỂ THỊ GIÁC

| | **C1. Digital Orbit** ⭐ Đề xuất | **C2. Abstract Signal Core** | **C3. Creative Tech Dimension** |
|---|---|---|---|
| Concept | Lõi + 3–4 vòng quỹ đạo = nhóm kỹ năng; vệ tinh = project | Một khối "tín hiệu" biến dạng (noise displacement) phản ứng chuột như sóng âm — AI đang "nghĩ" | Không gian lưới 3D nhiều lớp (layered planes), các tấm kính trôi, mỗi tấm là một section |
| Hero object | Sphere kính-kim loại + vòng mảnh + node instanced | Blob shader (vertex displacement), vỏ wireframe | 5–7 panel kính xếp lớp + camera parallax |
| Màu nhấn | Cyan (Frontend) + violet (AI) cân bằng | Violet chủ đạo, cyan phụ | Cyan chủ đạo, gần như đơn sắc |
| Motion | Chậm, tuần hoàn, "cơ học thiên thể"; hover cô lập vòng | Hữu cơ, liên tục, phản ứng nhạy | Parallax theo scroll mạnh hơn |
| Gắn dữ liệu | **Rất mạnh** — số vòng/node/vệ tinh sinh ra từ config | Yếu — chỉ có thể map biên độ/màu | Trung bình — panel = section |
| Rủi ro | Dễ thành "nguyên tử Bohr" sáo rỗng → giảm bằng vòng nghiêng không đều, độ dày khác nhau, ánh sáng rim | Shader tùy biến tốn GPU mobile; dễ thành "AI blob" đại trà | Dễ trượt sang scroll-heavy, mâu thuẫn "balanced motion"; transmission nhiều lớp rất nặng |

**Đề xuất: C1 Digital Orbit** — là biến thể duy nhất mà object thực sự *chứa thông tin* về bạn, có thể dùng lại làm điều hướng cho Skills, và tự "lớn lên" khi bạn thêm project.

---

## D. HERO SPECIFICATION

### D.1 Layout grid

| Breakpoint | Grid | Text | Object | Ghi chú |
|---|---|---|---|---|
| Desktop ≥ 1280 | 12 cột, container 1200px, gutter 24px | Cột 1–7, căn trái, `h1` fluid tới 88px | Cột 7–12, `min(40vw, 560px)` vuông, căn giữa dọc, chồng nhẹ 1 cột vào vùng trống bên phải text (không chồng chữ) | Hero `min-height: 100svh` nhưng tối đa 920px |
| Tablet 768–1279 | 8 cột | Cột 1–5 | Cột 5–8, `min(44vw, 420px)` | Chip nhóm kỹ năng nằm dưới object |
| Mobile < 768 | 4 cột, gutter 16px | Full width, ở trên | **Dưới CTA**, `min(78vw, 320px)` | Không bao giờ đặt sau text; hero có thể cao hơn 100svh, không sao |

Thứ tự DOM: eyebrow (toạ độ + "Available for…") → `h1` tên → role → tagline → CTA (Contact primary, CV secondary) → khu object (`aria-hidden` cho canvas) → chip nhóm kỹ năng (DOM, focusable).

### D.2 Nền
- `--bg` phẳng + 1 radial gradient rất nhẹ (violet 6% opacity) sau object + noise PNG 128×128 tile ở 3% opacity (≈ 2–4 KB) + vignette CSS. Không gradient mesh động.

### D.3 Particles (trong cùng canvas R3F với object)
- Trôi chậm (0.02–0.05 đơn vị/s), line nối khi khoảng cách < ngưỡng, opacity line 0.08–0.18.
- Pointer repulsion: bán kính ~ 1.2 đơn vị, lực damped (lerp 0.08/frame), chỉ trên thiết bị `pointer: fine`.
- Mật độ: **mobile 40, không vẽ line** · tablet 80 · desktop 140 (line tối đa ~ 300 segment). Tự hạ bậc nếu FPS trung bình < 45 trong 2s (PerformanceMonitor của drei).
- Phạm vi: chỉ trong vùng hero; mờ dần khi hero rời viewport, rồi **dừng render**.

### D.4 Tương tác
- **Chuột (pointer: fine):** object xoay theo chuột ±12° (damped, lerp 0.06), float sin biên độ 0.08, chu kỳ ~6s; hover vòng → isolate.
- **Touch:** không mouse-follow; xoay tự động rất chậm (0.05 rad/s); chạm chip DOM để isolate vòng. Không có tính năng phụ thuộc hover.
- **Bàn phím:** Tab tới chip → isolate vòng tương ứng; Enter → cuộn tới Skills.

### D.5 Entrance sequence (ms)

| t (ms) | Sự kiện | Duration | Easing |
|---|---|---|---|
| 0 | HTML prerender: `h1`, role, CTA hiển thị **ngay** (không opacity 0 cho `h1`) + SVG placeholder của object | — | — |
| 80 | Eyebrow, tagline, CTA: fade-up 12px, stagger 70ms | 500 | `--ease-out-expo` `cubic-bezier(0.16,1,0.3,1)` |
| sau `load` + idle (timeout 1500) | `import()` chunk 3D | — | — |
| ready | Crossfade SVG → canvas | 600 | `ease-out` |
| ready + 0 | Core scale 0.88 → 1 | 900 | `--ease-out-expo` |
| ready + 150 | Vòng "vẽ ra" (dash offset) lần lượt, stagger 120ms | 1100 | `cubic-bezier(0.65,0,0.35,1)` |
| ready + 600 | Particles fade 0 → 1 | 800 | linear |
| ready + 900 | Sao chổi CCMM quét qua 1 lần | 1400 | `ease-in-out` |

### D.6 Wave transition (Hero → About)
- Inline SVG cao 80–140px (fluid), 2 lớp path: lớp trước là sóng sin mềm, lớp sau là **dáng núi karst** (6–8 đỉnh tròn, kiểu Tràng An).
- Animation: lớp sóng `translateX` lặp vô hạn rất chậm (40s, path gấp đôi chiều rộng) — chỉ compositor, không đổi `d`. Lớp karst parallax nhẹ theo scroll (≤ 24px).
- Không JS / reduced-motion: hình tĩnh, vẫn đẹp.

---

## E. ANIMATION TIMELINE TOÀN TRANG

| Vùng | Trigger | Hiệu ứng | Duration / easing | Reduced motion |
|---|---|---|---|---|
| Page load | DOMContentLoaded | Text hero hiện ngay; phụ đề stagger | 500ms, out-expo | Không animation |
| Hero 3D | idle sau load | Mục D.5 | — | Hiển thị **ảnh tĩnh SVG/WebP**, không load chunk 3D |
| Hero rời viewport | scroll progress 0 → 1 của hero (passive scroll listener → ref, không re-render React) | Object xoay +25°, scale 1 → 0.9, opacity 1 → 0 trong 0–60% | nội suy tuyến tính, damped | Không |
| Wave | luôn | translateX 40s linear | — | Tĩnh |
| Section heading | IO threshold 0.15 | fade-up 16px | 600ms out-expo | Hiện ngay |
| About/Research | IO | đoạn văn stagger 60ms | 600ms | Hiện ngay |
| Skills | IO | các nhóm vẽ đường "orbit line" ngang (scaleX 0 → 1), chip stagger 40ms | 700ms | Hiện ngay |
| Trajectory (Education + Experience) | IO | timeline line vẽ từ trên xuống theo scroll (CSS `scaleY` với giá trị từ IO ratio) | — | Hiện đầy đủ |
| Projects | IO | card stagger 90ms, translateY 24 + opacity | 700ms out-expo | Hiện ngay |
| Certificates | IO | fade | 500ms | Hiện ngay |
| Contact | IO | fade-up | 600ms | Hiện ngay |
| Footer | — | không | — | — |
| Nav | IO trên từng section | indicator trượt tới mục active | 300ms ease-out | Đổi ngay, không trượt |

Quy tắc chung: không animation nào > 1.2s cho nội dung; không gì chặn đọc; chỉ dùng `transform` / `opacity`.

---

## F. 3D ASSET OPTIONS (Spline)

Đã thử: tìm kiếm web + truy cập `https://spline.design/community` → **HTTP 404**, không xem được trang community hay điều khoản license từng file. Vì vậy **tất cả đều UNVERIFIED**; không tải gì về.

| # | Tên / link | Mô tả (theo nguồn bên thứ ba) | Độ hợp concept | License / remix / thương mại / attribution / embed free | Chi phí hiệu năng |
|---|---|---|---|---|---|
| 1 | "spline radial" — [kombai.com/gallery/inspirations/spline-radial](https://kombai.com/gallery/inspirations/spline-radial/) | Vòng các tấm kính khúc xạ, xoay như vầng hào quang | Khá hợp (ring + glass) | **UNVERIFIED** toàn bộ | Glass refraction trong Spline → nặng (**UNVERIFIED**) |
| 2 | "NebulaRind" — [contra.com/community/…nebula-ring…](https://contra.com/community/LAlhL8W4-explore-3-d-nebula-ring-design-with) | Vòng tinh vân trôi nổi + liquid glass + state transitions | Hợp về thẩm mỹ, chưa gắn được dữ liệu | **UNVERIFIED** | **UNVERIFIED** |
| 3 | "Orb 🧿" by Kris M — [contra.com/p/s2lNFoB7-orb-3-d-abstract-art-in-spline](https://contra.com/p/s2lNFoB7-orb-3-d-abstract-art-in-spline) | Orb trừu tượng 3D làm bằng Spline | Hợp phần "core" | **UNVERIFIED** (có thể chỉ là portfolio showcase, không phải file remix) | **UNVERIFIED** |

**Kết luận chung về Spline:** runtime `@splinetool/runtime` + file scene thường nặng hơn nhiều so với một object R3F tự viết (con số chính xác **UNVERIFIED**); khó bind số vòng/node vào config; phụ thuộc hosting scene của Spline.

### F.1 Original R3F object (đề xuất)

| Phần | Geometry | Material | Ước lượng |
|---|---|---|---|
| Core | `IcosahedronGeometry(1, 5)` | `MeshPhysicalMaterial` metalness 0.6, roughness 0.18, clearcoat 1, iridescence 0.15 — **không dùng `transmission`** (đắt trên mobile); "kính" giả bằng fresnel rim | ~20k tris (desktop), detail 3 (~1.3k tris) trên mobile |
| Inner neural lattice | `IcosahedronGeometry(0.55, 1)` → `EdgesGeometry` | `LineBasicMaterial` violet, opacity 0.35 | 120 segments, 1 draw call |
| Rings ×3–4 | `TorusGeometry(r, 0.006, 6, 192)` mỗi vòng, nghiêng khác nhau (12°, −28°, 54°) | `MeshBasicMaterial` màu nhóm, opacity 0.6 | ~2.3k tris/vòng, 1 draw call/vòng |
| Skill nodes | `InstancedMesh` sphere nhỏ (detail 1) | Basic + additive | 1 draw call cho mọi node |
| Satellites (projects) | `InstancedMesh` octahedron | Physical đơn giản | 0–5 instance, 1 draw call |
| Particles | `Points` + `LineSegments` (cập nhật mỗi 2 frame, spatial grid) | `PointsMaterial` sprite tròn, additive | 2 draw calls |
| Ánh sáng | 1 `ambientLight` + 2 `directionalLight` (rim cyan, key trắng) + `Environment` preset nhỏ hoặc lightformer tự dựng (tránh tải HDR lớn) | — | — |
| Postprocessing | **Không bloom** (một full-screen pass). Glow giả bằng sprite additive | — | — |

Tổng: **~8–10 draw calls**, < 30k tris desktop / < 8k tris mobile. Fallback tĩnh: render một frame object ra **SVG/WebP ~20–30 KB** làm placeholder.

**Khuyến nghị: Original R3F object.** Lý do: duy nhất, gắn dữ liệu được, kiểm soát hiệu năng, không rủi ro license.

---

## G. TECHNOLOGY RECOMMENDATION

### G.1 So sánh Hero 3D

| Tiêu chí | Spline | **R3F + drei** ⭐ | Vanilla Three.js |
|---|---|---|---|
| Trọng lượng runtime | Nặng nhất (runtime + scene) — **UNVERIFIED** | three (~150 KB gzip, phần lớn tree-shake kém) + R3F (~40–50 KB) + drei chọn lọc (~10–30 KB) — ước lượng, **UNVERIFIED** | three (~150 KB) |
| Thời gian load | Phụ thuộc file scene từ CDN Spline | Một chunk lazy, cache được | Như R3F, nhỏ hơn ~40 KB |
| GPU mobile | Khó tinh chỉnh | Tinh chỉnh được (DPR, frameloop, LOD) | Tinh chỉnh được |
| Kiểm soát tương tác | Hạn chế qua event Spline | Đầy đủ, khai báo trong React | Đầy đủ, nhưng phải tự quản vòng đời |
| Bind dữ liệu config | Khó | **Rất dễ** (`skillGroups.map(...)`) | Được nhưng thủ công |
| Bảo trì | Cần Spline editor | Code React, cùng ngôn ngữ với project | Imperative, nhiều boilerplate cleanup |
| License | Tuỳ file community — **UNVERIFIED** | MIT | MIT |

### G.2 So sánh particles

| | Canvas 2D riêng | WebGL riêng | **Trong cùng scene R3F** ⭐ |
|---|---|---|---|
| Render loop | +1 loop | +1 context WebGL | Dùng chung loop/context |
| Chi phí | CPU vẽ line O(n²) | GPU, thêm context | GPU, không thêm context |
| Phạm vi | Có thể full trang | Có thể full trang | Giới hạn trong hero (đúng ưu tiên "ambient") |

→ Chọn **trong cùng scene R3F**, chỉ ở hero. Các section dưới dùng nền noise tĩnh. Đây là chỗ đầu tiên áp dụng quy tắc ưu tiên: particles toàn trang sẽ cạnh tranh với đọc nội dung → bỏ.

### G.3 Wave
SVG path (**chọn**) — nhẹ nhất, có fallback tĩnh, chỉ animate `transform`. CSS shape (`clip-path`) khó vẽ karst; canvas/shader quá nặng cho một đường viền.

### G.4 Scroll
IntersectionObserver hiện có + CSS + một passive scroll listener cho scroll-progress của hero là **đủ**. Không thêm Motion/GSAP/Lenis.

### G.5 Bảng công nghệ

| Feature | Recommended tech | Already installed? | Reason | Approx. gzip size | Performance impact |
|---|---|---|---|---|---|
| Scroll reveal / stagger | CSS + IntersectionObserver (refactor `useReveal`) | ✅ | Đủ cho mọi reveal cần thiết | ~0.5 KB | Rất thấp |
| Hero scroll-linked 3D | passive `scroll` → `useRef` → `useFrame` | ✅ (native) | Không re-render React | 0 | Thấp |
| Motion (Framer Motion) | **Không thêm** | ❌ | Lặp chức năng IO+CSS | ~5 KB (`LazyMotion`+`m`) tới ~35 KB full — **UNVERIFIED** | Trung bình |
| GSAP + ScrollTrigger | **Không thêm** | ❌ | Mạnh cho timeline phức tạp, nhưng ta không pin/scrub | ~25 KB + ~12 KB — **UNVERIFIED** | Trung bình |
| Lenis | **Không thêm** | ❌ | Thay đổi cảm giác scroll native, mâu thuẫn ràng buộc | ~4 KB — **UNVERIFIED** | Thấp nhưng ảnh hưởng UX/a11y |
| Spline runtime | **Không thêm** | ❌ | Nặng, khó bind dữ liệu, license chưa rõ | Hàng trăm KB — **UNVERIFIED** | Cao |
| three | **Thêm** (lazy chunk) | ❌ | Lõi 3D | ~150 KB — **UNVERIFIED** | Chỉ khi đã tải |
| @react-three/fiber | **Thêm** (lazy chunk) | ❌ | Khai báo, bind config | ~40–50 KB — **UNVERIFIED** | Thấp (overhead nhỏ) |
| @react-three/drei | **Thêm**, import từng phần (`PerformanceMonitor`, `AdaptiveDpr`, `Lightformer`) | ❌ | Tiết kiệm công | ~10–30 KB phần dùng — **UNVERIFIED** | Thấp |
| Canvas 2D particles | **Không dùng** | — | Thay bằng particles trong R3F | — | — |
| SVG/CSS waves | **Dùng** | ✅ (native) | Nhẹ, có fallback | < 2 KB | Rất thấp |
| Prerender HTML | Script build tự viết với `react-dom/server` (không thêm dependency) | ✅ | Nội dung đọc được khi tắt JS, LCP sớm, SEO | 0 runtime | Cải thiện LCP |

### G.6 Phân nhóm & stack cuối
- **Keep:** React 18, Vite 5, TS, Tailwind v3, IntersectionObserver, lucide-react, react-icons (tree-shaken), `clsx`/`tailwind-merge`/`cva`.
- **Add:** `three`, `@react-three/fiber@8` (tương thích React 18), `@react-three/drei` (chọn lọc) — tất cả nằm trong **một chunk dynamic import**.
- **Do not add:** Spline, GSAP, Motion, Lenis, postprocessing/bloom.
- **Remove:** react-query, Radix không dùng, recharts, date-fns, react-day-picker, zod, react-hook-form, cmdk, vaul, embla, input-otp, react-resizable-panels, next-themes, sonner (nếu không dùng), `bun.lock`.

---

## 5. VISUAL DESIGN SYSTEM (tokens)

### 5.1 Màu (dark — chế độ chính)

| Token | HEX | Vai trò |
|---|---|---|
| `--bg` | `#0A0C10` | Deep Charcoal, nền trang |
| `--surface` | `#11141B` | Card, section xen kẽ |
| `--elevated` | `#191D26` | Popover, nav mobile, card hover |
| `--border` | `#2A303C` | Viền 1px (trang trí, không mang thông tin) |
| `--text-primary` | `#EEF1F6` | Heading, body chính |
| `--text-secondary` | `#B6BECA` | Body phụ, mô tả |
| `--text-muted` | `#8C95A5` | Label, meta, eyebrow |
| `--accent-cyan` | `#38D9F0` | Electric Cyan — tương tác/primary |
| `--accent-violet` | `#A99BFF` | Soft Violet — AI/điểm nhấn phụ |
| `--danger` | `#FF6B7A` | Lỗi form |
| `--success` | `#4ADE9A` | Gửi form thành công |
| `--metal-1/2` | `#C9D2DE` / `#5E6878` | Gradient vật liệu kim loại (3D + SVG placeholder) |

**Tỷ lệ tương phản (đã tính theo WCAG 2.x):**

| Foreground | trên `--bg` | trên `--surface` | trên `--elevated` |
|---|---|---|---|
| `--text-primary` | 17.29 | 16.27 | 14.90 |
| `--text-secondary` | 10.45 | 9.83 | 9.00 |
| `--text-muted` | 6.48 | 6.10 | 5.59 |
| `--accent-cyan` | 11.51 | 10.84 | 9.92 |
| `--accent-violet` | 8.22 | 7.74 | 7.08 |
| `--danger` | 7.12 | 6.70 | 6.13 |
| `--success` | 11.38 | 10.71 | 9.80 |
| `--border` | 1.48 | 1.39 | 1.27 — *chỉ trang trí; viền input dùng `--text-muted` (≥ 3:1)* |

Nút primary: chữ `#0A0C10` trên nền cyan = **11.51:1**. Mọi cặp body text đều ≥ 4.5:1 ✅.

**Nếu giữ light mode** (Q3): bg `#F6F7F9`, surface `#FFFFFF`, text `#0E1116` (17.64), secondary `#3D4553` (9.01), muted `#5B6474` (5.57), cyan-ink `#0A7C92` (4.54 — sát ngưỡng, chỉ dùng cho link ≥ 16px), violet-ink `#5B47D6` (5.91).

**Quy tắc accent:** cyan = chỉ phần tử tương tác (link, nút primary, focus ring, nav active) + vòng Frontend. Violet = nhãn AI, highlight phụ, vòng AI. Glow chỉ ở 3 chỗ: focus ring, nút primary khi hover, object hero. Không bao giờ dùng glow cho text body.

### 5.2 Mapping Tailwind (v3)
```ts
colors: {
  bg: "rgb(var(--bg) / <alpha-value>)", surface: …, elevated: …, line: …,
  ink: { DEFAULT: …primary, 2: …secondary, 3: …muted },
  cyan: …, violet: …, danger: …, success: …
}
```
Biến CSS lưu dạng kênh RGB (`--bg: 10 12 16`) để dùng được `bg-bg/80`. Giữ alias shadcn (`--background`, `--foreground`…) trỏ về token mới để `ui/button`, `ui/badge` vẫn chạy.

### 5.3 Typography
- **Giữ** Space Grotesk (heading) + Inter (body) — **cần kiểm tra subset `vietnamese`** cho dấu "Đặng Đăng Dương" (cả hai font Google đều có subset tiếng Việt theo hiểu biết của tôi — **UNVERIFIED**, xác minh khi Phase 1). Thêm **JetBrains Mono** (400 only) cho nhãn kỹ thuật (toạ độ, số thứ tự section, tag).
- Tự host font (woff2, subset latin + vietnamese) + `font-display: swap` + preload 1 file heading → bỏ phụ thuộc Google Fonts chặn render.
- Fluid scale:

| Token | `clamp()` | Dùng cho |
|---|---|---|
| `--fs-display` | `clamp(2.5rem, 1.6rem + 4.2vw, 5.5rem)` | `h1` hero |
| `--fs-h2` | `clamp(1.875rem, 1.4rem + 2vw, 3rem)` | Section title |
| `--fs-h3` | `clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)` | Card title |
| `--fs-body` | `clamp(1rem, 0.96rem + 0.2vw, 1.125rem)` | Body |
| `--fs-small` | `0.875rem` | Meta |
| `--fs-label` | `0.75rem`, mono, `letter-spacing: 0.14em`, uppercase | Eyebrow |

Line-height: display 1.02, heading 1.15, body 1.65. Độ dài dòng body ≤ 68ch.

### 5.4 Spacing, radius, shadow, container
- Spacing: thang 4px — `4 8 12 16 24 32 48 64 96 128`. Section padding `clamp(4rem, 3rem + 5vw, 8rem)`.
- Radius: `--r-sm 6px` (tag), `--r-md 10px` (button/input), `--r-lg 16px` (card), `--r-pill 999px` (chip).
- Shadow/glow: `--elev-1: 0 1px 0 rgb(255 255 255/0.04) inset, 0 8px 24px rgb(0 0 0/0.35)`; `--glow-cyan: 0 0 0 1px rgb(56 217 240/0.5), 0 0 24px rgb(56 217 240/0.25)`; chỉ 2 cấp.
- Container: `--container: 1200px`, prose `720px`; grid 4/8/12 cột, gutter 16/24/24.
- Motion tokens: `--dur-fast 160ms`, `--dur-base 300ms`, `--dur-slow 600ms`, `--ease-out-expo`, `--ease-in-out`.

### 5.5 Component
- **Button** — *primary*: nền cyan, chữ `--bg`, hover `--glow-cyan` + translateY(−1px), active scale 0.98; *secondary*: viền `--text-muted`, chữ primary, hover nền `--elevated`; *ghost*: chỉ chữ, hover gạch chân offset 4px. Mọi nút cao ≥ 44px.
- **Card** — *project*: surface, viền `--border`, ảnh 16:10, hover viền chuyển cyan 40% + nâng 2px; *skill group*: thanh màu nhóm 2px bên trái, danh sách chip; *certificate*: compact, issuer + năm mono.
- **Nav** — desktop: sticky, blur nền `bg/72`, indicator gạch dưới cyan trượt theo section active; mobile: nút menu 44×44, panel full-width `--elevated`, đóng bằng Esc/click link, trap focus.
- **Tag/badge**: pill viền, mono 12px. **Section header**: số thứ tự mono `01 —` + eyebrow + title.
- **Focus-visible:** `outline: 2px solid var(--accent-cyan); outline-offset: 3px;` cho mọi phần tử tương tác; bỏ `focus:outline-none`. Skip link "Bỏ qua đến nội dung".

---

## 6. ĐỀ XUẤT TỪNG SECTION

**Thứ tự đề xuất (kể câu chuyện "core → orbit → trajectory → output"):**
Hero · About (+ Research + sở thích) · Skills · Trajectory (Experience + Education) · Projects · Certificates & Achievements · Contact (+ CV) · Footer

**Gộp:** Research Interests → About (chỉ 1 dòng dữ liệu); Experience + Education → "Trajectory" timeline (hiện mỗi bên chỉ 1 mục); Resume/CV → CTA trong Hero + Contact (không cần section riêng); Certificates + Achievements → 1 section.

| Section | Purpose | Layout (desktop / mobile) | Hierarchy | Visual chính | Animation | Data source | Ẩn khi |
|---|---|---|---|---|---|---|---|
| **Hero** | Ai, làm gì, liên hệ | Mục D.1 | Tên → role → tagline → CTA | Object orbit | D.5 | `site.*`, `skillGroups` | Không bao giờ |
| **About** | Con người + hướng đi | 2 cột 7/5: bio + "Currently exploring" (research) + "Off-screen" (workout, climbing, movies, exploring) / 1 cột | Bio → research → sở thích | Icon line nhỏ cho mỗi sở thích; dải karst mảnh | Stagger đoạn | `about.bio[]`, `research[]`, `hobbies[]` | Ẩn khối con nếu mảng rỗng; section ẩn nếu cả 3 rỗng |
| **Skills** | Chứng minh năng lực | 3–4 cột nhóm / accordion-free stack | Tên nhóm (màu vòng) → chip kỹ năng | Mini "orbit line" màu nhóm; đồng bộ highlight với hero | Line vẽ + chip stagger | `skillGroups[{id,label,color,items[]}]` | Ẩn nhóm rỗng; section ẩn nếu 0 nhóm |
| **Trajectory** | Hành trình học + làm | Timeline dọc 2 làn (học / làm) / 1 làn | Thời gian (mono) → vai trò/trường → tổ chức → 2–3 bullet | Đường timeline + node | Line vẽ theo IO | `experience[]`, `education[]` | Ẩn làn rỗng; section ẩn nếu cả hai rỗng |
| **Projects** | Sản phẩm thật | Grid 3 / 1 cột; project đầu tiên có thể "featured" span 2 | Tên → vấn đề → vai trò → stack → kết quả → link | Ảnh hoặc ảnh tạo từ SVG pattern theo màu nhóm nếu `image` trống | Card stagger | `projects[]` | **Ẩn hoàn toàn** khi rỗng (hiện tại rỗng) + nav item cũng ẩn |
| **Certificates & Achievements** | Bằng chứng bên ngoài | List 2 cột / 1 cột | Tên → issuer → năm → link | Badge mono | Fade | `certificates[]`, `achievements[]` | Ẩn khi cả hai rỗng (hiện tại rỗng). Ghi chú: "English B2" có thể vào đây nếu có chứng chỉ (IELTS/VSTEP…) |
| **Contact** | Chuyển đổi | 2 cột: lời mời + email/socials / form; mobile stack | CTA → email → socials → (form) → tải CV | Một vòng quỹ đạo mảnh "đóng" trang | Fade-up | `site.email`, `site.altEmail`, `socials[]`, `site.cvUrl` | Nút CV ẩn khi `cvUrl` rỗng; form ẩn nếu chọn mailto-only |
| **Footer** | Kết thúc | 1 hàng / stack | © tên, năm, "Built with R3F" , back-to-top | — | — | `site.name`, `socials` | Không |

Nav chỉ hiển thị mục của section đang được render (sinh từ danh sách section, không hard-code `nav[]`).

---

## 9. PERFORMANCE, ACCESSIBILITY & FALLBACK

**Mục tiêu:** giữ nguyên các mục tiêu bạn đặt (Perf ≥ 85 mobile, A11y/BP/SEO ≥ 95, LCP < 2.5s, CLS < 0.1, INP < 200ms). Đánh giá: **khả thi**, với điều kiện có prerender HTML và 3D tải lazy. Ngân sách JS ban đầu ≤ 200 KB gzip là dư — mục tiêu nội bộ đề xuất **≤ 90 KB gzip**.

| Chiến lược | Cách làm |
|---|---|
| Code-splitting | `const OrbitScene = lazy(() => import("./three/OrbitScene"))`; three/R3F/drei chỉ xuất hiện trong chunk này (kiểm bằng `vite build` + `rollup-plugin-visualizer` tạm thời hoặc đọc manifest). |
| Lazy 3D | Chỉ import sau `load` + `requestIdleCallback` (fallback `setTimeout 1200`), **và** chỉ khi hero đang trong viewport, không reduced-motion, có WebGL. Placeholder SVG/WebP cùng kích thước → CLS = 0. |
| LCP | `h1` prerender trong HTML, không bắt đầu ở opacity 0. Preload font heading. |
| Pause render | `frameloop="demand"` khi hero ra khỏi viewport (IO) và khi `document.hidden` (visibilitychange); `invalidate()` khi cần. |
| DPR | `dpr={[1, 1.5]}` mobile, `[1, 2]` desktop; `AdaptiveDpr` + `PerformanceMonitor` hạ bậc (bớt particles → bỏ line → detail core thấp → ảnh tĩnh). |
| Cleanup | R3F tự dispose geometry/material khi unmount; thêm `dispose` thủ công cho geometry tạo trong `useMemo`; gỡ listener scroll/pointer/visibility trong cleanup. |
| Reduced motion | `prefers-reduced-motion: reduce` → không tải chunk 3D, hiển thị ảnh tĩnh; particles không có; reveal hiện ngay; wave tĩnh; `scroll-behavior: auto`. |
| No-WebGL / low-power | Kiểm `canvas.getContext("webgl2")`; `navigator.hardwareConcurrency <= 4` + `deviceMemory <= 4` (nếu có) + `Save-Data` → dùng ảnh tĩnh. |
| Touch | `matchMedia("(pointer: coarse)")` → tắt mouse-follow, thay bằng chip DOM; không tính năng nào chỉ có ở hover. |
| Không JS | Prerender toàn bộ nội dung vào `dist/index.html`; `.reveal` chỉ ẩn khi `html.js` có mặt (thêm bằng 1 dòng inline script). |
| SEO/meta | `title` "Đặng Đăng Dương — Frontend & AI Engineer", description thật, canonical thật, OG image PNG 1200×630, `twitter:card`, favicon SVG + PNG 32 + apple-touch-icon, `theme-color #0A0C10`, JSON-LD `Person` (tên, email, alumniOf VNU-IS, sameAs). `lang` theo Q2. Thêm `sitemap.xml`. |
| A11y | Skip link, landmark, `<label>` cho form, `aria-hidden` canvas + mô tả text thay thế, focus-visible, mobile menu trap focus + Esc, target ≥ 44px. |

**Chỗ các hiệu ứng tranh nhau (đã áp quy tắc ưu tiên):**
1. Particles vs hero object (cùng GPU) → particles giảm 140 → 40 trên mobile, bỏ line; hạ bậc particles trước object.
2. Particles toàn trang vs readability → **bỏ** particles ngoài hero.
3. Glass `transmission` vs GPU mobile → thay bằng physical metal + fresnel.
4. Bloom vs mọi thứ → bỏ, dùng sprite additive.
5. Wave động vs text hero → wave nằm dưới CTA, biên độ thấp; lớp karst gần như tĩnh.
6. Scroll-linked xoay object vs reveal của About → object mờ hết trước khi About heading reveal (0–60% progress).

---

## H. ROADMAP PHASES 1–6

Xác minh chung cho mọi phase: `npm run build` ✅ · `npm run lint` 0 error · `npx tsc -p tsconfig.app.json --noEmit` ✅ · kiểm thủ công 375 / 768 / 1280 / 1920 px.

### Phase 1 — Design tokens & layout foundation
- **Goal:** nền sạch, token mới, schema dữ liệu mới, nav mobile.
- **Tasks:** gỡ provider/dependency/file chết; xoá `bun.lock`; token CSS + Tailwind mapping; tự host font; schema `config.ts` có type + helper `hasItems()`; Navbar mới (mobile menu, active indicator, skip link); `SectionHeading` mới; button/tag/card primitive; sửa 3 lỗi lint.
- **Files:** `package.json`, `src/App.tsx`, `src/index.css`, `tailwind.config.ts`, `index.html`, `src/data/config.ts`, `src/components/Navbar.tsx`, `SectionHeading.tsx`, `src/components/ui/*` (xoá phần lớn), `public/fonts/*`.
- **New deps:** không.
- **Acceptance:** JS initial gzip giảm so với 108.55 KB (ghi số mới); không còn class màu đơn sắc cũ; nav dùng được ở 375px bằng bàn phím và cảm ứng; lint 0 error.

### Phase 2 — Hero 3D + particles
- **Goal:** object orbit gắn dữ liệu, lazy, có fallback.
- **Tasks:** `src/three/OrbitScene.tsx`, `Core`, `Rings`, `SkillNodes`, `Satellites`, `Particles`; hook `useCanRender3D` (WebGL, reduced-motion, low-power, pointer); placeholder SVG; pause khi off-screen/hidden; chip nhóm DOM đồng bộ hover.
- **Files:** `src/components/Hero.tsx`, `src/three/**`, `src/hooks/*`, `public/hero-orbit.svg`.
- **New deps:** `three`, `@react-three/fiber@8`, `@react-three/drei`, `@types/three`.
- **Acceptance:** chunk 3D tách riêng, không có trong initial; `h1` hiển thị trước khi chunk tải (kiểm bằng throttle Slow 4G trong DevTools); desktop ~60fps, mobile mid-range ≥ 30fps (đo bằng Performance panel/FPS meter); 0 vòng/node khi config rỗng không gây lỗi; reduced-motion → không request chunk 3D.

### Phase 3 — Sections redesign & content binding
- **Goal:** tất cả section theo mục 6, ẩn khi rỗng.
- **Files:** `About.tsx`, `Skills.tsx`, `Trajectory.tsx` (mới), `Projects.tsx`, `Certificates.tsx` (mới), `Contact.tsx`, `Footer.tsx`, `pages/Index.tsx`, `config.ts`.
- **New deps:** không.
- **Acceptance:** xoá dữ liệu một mảng → section + nav item biến mất; form có label, thông báo `aria-live`; không còn chuỗi hard-code ngoài config (trừ nhãn UI chung).

### Phase 4 — Scroll animations & wave transitions
- **Goal:** timeline mục E.
- **Files:** `useReveal.ts`, `index.css`, `WaveDivider.tsx` (mới), `OrbitScene.tsx` (scroll progress).
- **New deps:** không.
- **Acceptance:** không layout shift do animation (CLS < 0.1 trong Lighthouse); bật reduced-motion trong DevTools → mọi thứ hiện ngay, wave tĩnh; tắt JS → wave vẫn hiển thị.

### Phase 5 — Performance, a11y, fallbacks, SEO
- **Goal:** đạt mục tiêu Lighthouse.
- **Tasks:** prerender script (`scripts/prerender.mjs` dùng `react-dom/server` + `vite build --ssr`), gate `.reveal` bằng `html.js`, meta/OG/JSON-LD/favicon/sitemap, kiểm tương phản thực tế, test bàn phím + screen reader (NVDA), hạ bậc FPS.
- **Files:** `index.html`, `package.json` (script `build`), `scripts/prerender.mjs`, `src/main.tsx` (`hydrateRoot`), `public/og.png`, `public/favicon.*`, `public/sitemap.xml`.
- **New deps:** không (có thể dùng tạm `rollup-plugin-visualizer` dev-only để đo, rồi gỡ).
- **Acceptance:** Lighthouse mobile Perf ≥ 85, A11y ≥ 95, BP ≥ 95, SEO ≥ 95 (chạy 3 lần lấy median); `curl dist/index.html` chứa tên và toàn bộ nội dung; tắt JS vẫn đọc được tất cả.

### Phase 6 — Polish & QA
- **Goal:** chi tiết hoàn thiện.
- **Tasks:** tinh chỉnh timing/easing, ánh sáng object, copywriting, test Safari iOS/Chrome Android/Firefox, 404 page theo style mới, cập nhật README cho dự án của bạn, (tuỳ chọn) vài test vitest cho helper "ẩn khi rỗng".
- **Acceptance:** checklist responsive 4 breakpoint, không lỗi console, README khớp code.

---

## I. NỘI DUNG CÒN THIẾU (cần bạn cung cấp)

| Section | Cần |
|---|---|
| Hero | **Tagline 1 dòng**; xác nhận cách viết role (ví dụ: "Information & Computer Engineering student — Frontend & AI"); trạng thái "Available for…" (internship? full-time? từ khi nào?) |
| About | **Bio 3–5 câu**; cách cân bằng hai mục tiêu "AI Engineering" và "Designer" (cái nào là chính?) |
| Research | 2–4 chủ đề cụ thể trong "AI và Website design" (ví dụ: generative UI, HCI cho AI, computer vision…) |
| Skills | **Danh sách kỹ năng cụ thể theo nhóm** — hiện chỉ có "frontend, backend, AI data" (cần tên công cụ/ngôn ngữ: React? Python? PyTorch? SQL? Figma?…) và mức độ nếu muốn |
| Experience | Tên đầy đủ của **CCMM**, vai trò cụ thể ("Dev" gì?), tháng/năm bắt đầu–kết thúc, 2–3 bullet tác động |
| Education | Tên chính thức tiếng Anh của trường và ngành (VNU-IS = VNU International School? ngành chính xác?), GPA 3.0 trên thang 4? có muốn hiển thị không? |
| Projects | 3–5 project (tên, vấn đề, vai trò, stack, kết quả, GitHub, demo, ảnh). Đến khi có, section sẽ ẩn |
| Certificates | Chứng chỉ tiếng Anh B2 (tên kỳ thi, năm), giải thưởng nếu có |
| CV | File PDF thật (hiện `public/cv.pdf` là placeholder 548 byte) |
| Contact | Link **GitHub**, **LinkedIn** (hiện chưa có) — sẽ ẩn nếu không có; xác nhận có hiển thị email trường không |
| Location | Xác nhận dùng toạ độ Ninh Bình (≈ 20.25°N, 105.97°E — **UNVERIFIED**, cần kiểm khi Phase 3) hay chỉ chữ "Ninh Bình, Việt Nam · UTC+7" |
| Assets | Ảnh chân dung (tuỳ chọn), domain/URL deploy (cho canonical, OG) |
| References | Mục "I like / I do NOT want" trong prompt đang để trống — nếu bạn có link tham khảo, gửi để tinh chỉnh |

---

## J. RỦI RO & TRADE-OFF (Top 5)

| # | Rủi ro | Mitigation |
|---|---|---|
| 1 | **Nội dung quá mỏng** (chưa project, chứng chỉ, bio) → trang 3D đẹp nhưng "rỗng ruột", phản tác dụng với nhà tuyển dụng | Quy tắc ẩn khi rỗng; gộp section; ưu tiên thu thập nội dung (mục I) trước Phase 3; object hiển thị *đúng* số kỹ năng thật thay vì trang trí |
| 2 | Chunk 3D (~200–250 KB gzip ước lượng, **UNVERIFIED**) làm chậm máy yếu | Lazy + idle + điều kiện viewport/WebGL/reduced-motion/low-power; fallback ảnh tĩnh |
| 3 | Object orbit bị sáo rỗng ("nguyên tử") | Vòng nghiêng bất đối xứng, độ dày khác nhau, lõi lattice AI bên trong, chi tiết karst + toạ độ |
| 4 | Prerender + hydrate phát sinh lỗi hydration (ví dụ `new Date().getFullYear()` trong Footer, đọc `localStorage` lúc render) | Không dùng giá trị phụ thuộc client khi render lần đầu; chạy check console ở Phase 5 |
| 5 | Nâng cấp dependency (React 19, R3F 9, Tailwind 4) giữa chừng gây vỡ | Khoá React 18 + R3F 8 + Tailwind 3 trong suốt dự án; một lockfile; cài phiên bản cụ thể |

---

## 11. CÂU HỎI CẦN BẠN DUYỆT

1. **Biến thể:** (a) Digital Orbit ⭐ · (b) Abstract Signal Core · (c) Creative Tech Dimension
2. **Ngôn ngữ nội dung site:** (a) Tiếng Anh ⭐ (hợp mục tiêu AI Engineer/Designer, nhà tuyển dụng quốc tế) · (b) Tiếng Việt · (c) Song ngữ có nút chuyển (tốn thêm ~1 phase)
3. **Light mode:** (a) Chỉ dark ⭐ (3D/glow thiết kế cho 1 chế độ) · (b) Giữ toggle dark/light
4. **Chi tiết cá nhân Ninh Bình:** (a) Wave → dáng núi karst + nhãn toạ độ ⭐ · (b) Chỉ karst, không toạ độ · (c) Sóng trừu tượng thuần
5. **Form liên hệ:** (a) Bỏ form, chỉ nút email + socials ⭐ (đơn giản, không cần tài khoản) · (b) Giữ form với Formspree (bạn tạo endpoint) · (c) Form fallback `mailto:`
6. **Email chính hiển thị:** (a) `dangduong17092005@gmail.com` ⭐ (dùng được sau khi tốt nghiệp) · (b) Email VNU · (c) Cả hai
7. **Định vị nghề nghiệp ở Hero:** (a) "Frontend & AI Engineer" là chính, Design là thế mạnh phụ ⭐ · (b) "Creative Engineer — AI × Design" cân bằng · (c) Bạn tự đặt câu chữ
