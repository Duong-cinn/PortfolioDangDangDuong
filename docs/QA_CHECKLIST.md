# QA checklist — việc cần bạn tự kiểm tra

Các mục dưới đây **không tự động hoá được** (cần thiết bị thật, trình đọc màn hình, hoặc mắt người).
Những gì đã được kiểm tự động: `npm run qa` (typecheck strict, lint, 15 test, build + prerender), Lighthouse mobile, ảnh chụp 375 / 1280 px, chế độ tắt JavaScript.

Chạy bản production trước khi kiểm: `npm run build && npm run preview` → mở `http://localhost:4173`.

## 1. Trước khi publish (bắt buộc)
- [ ] `npm run build` **không còn** cảnh báo `content-guard` (đã thay hết `// SAMPLE` và `// TODO(content)` trong `src/data/config.ts`).
- [ ] Đã đặt `site.url` → build sinh `sitemap.xml`, canonical, `og:url`.
- [ ] Đã thêm GitHub / LinkedIn vào `socials`, link dự án thật (`github`, `demo`).
- [ ] Đã đặt file CV vào `public/` và `site.cvUrl`.
- [ ] Đã xác nhận toạ độ `20.25°N · 105.97°E`, tên tiếng Anh chính thức của trường và ngành, thang GPA.
- [ ] Chạy `npm run og` sau khi sửa nội dung → kiểm `public/og.png` trông đúng.

## 2. Điện thoại thật (Android tầm trung + iPhone nếu có)
- [ ] Hero: chữ hiện ngay, object 3D xuất hiện sau ~1–2 s, không giật khi cuộn.
- [ ] Object tự xoay chậm (không theo ngón tay); chạm chip "Frontend…" → cuộn tới đúng nhóm trong Skills, card được viền sáng.
- [ ] Mở/đóng menu (☰): chạm link → menu đóng và cuộn đúng section.
- [ ] Xoay ngang màn hình: layout không vỡ, object vẫn nằm đúng ô.
- [ ] Máy yếu: nếu thấy giật, đợi vài giây — hệ thống tự hạ chất lượng hoặc chuyển về hình SVG tĩnh.
- [ ] Safari iOS: font tiếng Việt (Đặng Đăng Dương) hiển thị đúng dấu.

## 3. Desktop
- [ ] Chrome, Firefox, Safari/Edge: object theo chuột nhẹ nhàng; hover một vòng → các vòng khác mờ; click vòng → nhảy tới nhóm kỹ năng.
- [ ] Màn hình 1920 px và 2560 px: nội dung không bị kéo giãn quá rộng, object không quá nhỏ.
- [ ] Chuyển tab rồi quay lại: animation tiếp tục bình thường (không nhảy cóc).

## 4. Bàn phím & trình đọc màn hình
- [ ] Nhấn `Tab` ngay khi tải trang → hiện "Skip to content"; `Enter` → nhảy vào nội dung.
- [ ] Tab qua toàn trang: mọi link/nút đều có viền focus cyan rõ ràng, thứ tự hợp lý.
- [ ] NVDA (Windows) hoặc VoiceOver (macOS/iOS): đọc được tên, role, các tiêu đề section; canvas 3D và hình karst **không** bị đọc (đã `aria-hidden`).
- [ ] Nút "Copy email" → trình đọc thông báo "Email address copied to clipboard".

## 5. Tuỳ chọn hệ thống
- [ ] Bật *Reduce motion* (Windows: Settings → Accessibility → Visual effects → Animation effects tắt; macOS/iOS: Reduce Motion) → không có 3D, không animation, nội dung hiện ngay.
- [ ] Bật *Data Saver* trên Android Chrome → hiện SVG tĩnh thay vì 3D.
- [ ] Phóng to trình duyệt 200%: không mất nội dung, không cuộn ngang.

## 6. Sau khi deploy
- [ ] Dán link vào Facebook / LinkedIn / Zalo → thẻ chia sẻ hiện ảnh `og.png` (build tự đổi `/og.png` thành URL tuyệt đối khi `site.url` đã đặt).
- [ ] Chạy lại Lighthouse trên URL thật (PageSpeed Insights) để có số liệu với mạng/CDN thật.
- [ ] Truy cập một đường dẫn không tồn tại → trang "Lost in orbit".
