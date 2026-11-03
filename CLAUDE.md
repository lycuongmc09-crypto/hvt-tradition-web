# CLAUDE.md — Phòng Truyền Thống Online, THPT Hoàng Văn Thụ

File này mô tả "luật chơi" của dự án để AI editor (Claude / các skills) làm việc đúng định hướng.
Đọc trước khi sửa bất kỳ thứ gì.

## 1. Bối cảnh & đối tượng

- Website truyền thống của **Trường THPT Hoàng Văn Thụ** (phường Vàng Danh, tỉnh Quảng Ninh), do **CLB Tin học** nhà trường phát triển.
- Người xem: **học sinh đang theo học**, **phụ huynh**, **cựu học sinh nhiều khóa**, **thầy cô**. Đa số truy cập bằng **điện thoại**, mạng không ổn định.
- Mục tiêu cảm xúc: trang trọng, ấm áp, tự hào — **không** giống web bán hàng hay template AI đại trà.

## 2. Công nghệ (đã chốt, không đổi tùy tiện)

| Thành phần | Giá trị |
|---|---|
| Framework | React 18 + Vite 5 (SPA, `base: './'` → build ra web tĩnh chạy ở mọi thư mục) |
| Styling | Tailwind CSS 3 (không dùng shadcn/ui, không thêm UI kit mới) |
| Ngôn ngữ | JavaScript (`.jsx`), **không** chuyển sang TypeScript nếu không được yêu cầu |
| Lưu trữ | `localStorage` (key `hvt_v37_posts`, `hvt_banner_img`) — giữ nguyên key để không mất dữ liệu cũ |
| Font | Google Fonts: `Be Vietnam Pro` (UI) + `Playfair Display` (tiêu đề truyền thống) |

Cấu trúc: `src/App.jsx` (state chính) · `src/data.js` (dữ liệu mẫu + tiện ích) · `src/components/*`.

## 3. Thương hiệu (brand tokens)

Sửa màu/font ở `tailwind.config.js`, **không** hard-code hex trong component.

- `primary` = `#1e3a8a` — xanh dương đậm (màu áo cờ đỏ sao vàng / đồng phục), dùng cho header, tiêu đề, nút chính.
- `accent`  = `#b45309` — vàng đồng (giấy cũ, huy hiệu), dùng cho badge năm, điểm nhấn.
- `ink`     = `#1c1917` — màu chữ chính; `paper` = `#faf7f2` — nền "giấy" nhẹ.
- Tiêu đề lớn dùng font-serif `Playfair Display`; body dùng `Be Vietnam Pro`.
- Giọng văn: tiếng Việt có dấu đầy đủ, xưng hô "nhà trường / thầy và trò", câu ngắn, trang trọng, không sáo rỗng.

## 4. Nguyên tắc thiết kế (frontend-design)

1. **Bản sắc trước, hiệu ứng sau.** Mọi trang phải "ra chất phòng truyền thống": bố cục theo mốc năm, ảnh tư liệu lớn, khung viền mảnh kiểu giấy archive.
2. **Không pattern AI mặc định**: cấm gradient tím-hồng, cấm card bo góc đều tăm tắp everywhere, cấm emoji thay icon (dùng SVG inline).
3. **Timeline là nhân vật chính** cho mục Lịch Sử Hình Thành; **lưới ảnh ký ức** cho mục Ký ước trường xưa.
4. Ảnh luôn có `alt` mô tả, `loading="lazy"`, và fallback khi link hỏng/Drive riêng tư.
5. Tôn trọng `prefers-reduced-motion`: tắt auto-slider và animation.

## 5. Checklist accessibility / UX (web-design-guidelines)

- [ ] Mọi control tương tác là `<button>`/`<a>`, có `aria-label` khi chỉ có icon.
- [ ] Focus ring nhìn thấy được (`focus-visible`), tab order hợp lý.
- [ ] Modal: mở = focus vào phần tử đầu, `Esc` đóng, `Tab` bị nhốt trong modal, nền không scroll, trả focus về nút đã mở.
- [ ] Màu đạt tương phản WCAG AA (≥ 4.5:1 cho chữ nhỏ).
- [ ] Điểm chạm ≥ 44px trên mobile; menu mobile đóng/mở bằng trạng thái + `aria-expanded`.
- [ ] Nội dung responsive từ 360px; timeline cuộn ngang có nút mui tên và hỗ trợ phím mũi tên.
- [ ] Thông báo lỗi/thành công dùng vùng `role="status"` / `role="alert"`, không dùng `alert()`.

## 6. Quy trình làm việc

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # xuất dist/ (web tĩnh, upload Netlify/Vercel/GitHub Pages)
```

- Mỗi lần sửa xong: chạy `npm run build` để chắc chắn không lỗi biên dịch.
- Không commit `node_modules/`, `dist/`.
- Khi cần bảo mật thật (nhiều admin, dữ liệu chung): chỉ đổi lớp gọi dữ liệu trong `src/data.js` để chuyển sang backend (Next.js + DB) mà không đụng UI.

## 7. Bộ skills đề nghị (theo mức cần dùng)

| Skill | Khi nào dùng | Ghi chú cho repo này |
|---|---|---|
| `frontend-design` | Luôn luôn | Skill chính. Web truyền thống cần cá tính, giàu cảm xúc. |
| `web-design-guidelines` (Vercel) | Sau mỗi lần làm UI | Audit accessibility + UX + responsive cho phụ huynh/học sinh mobile. |
| `redesign-existing-projects` | Khi nâng cấp giao diện cũ | Dùng khi muốn "làm mới" mà vẫn giữ React + Tailwind. |
| `tailwind` | Khi chỉnh styling | Dự án đã dùng Tailwind 3 — nhất quán token màu. |
| `shadcn` | *Chưa bật* | Chỉ cài nếu chấp nhận thêm React Query/lib mới; hiện tại chưa cần. |
| `vercel-react-best-practices` | Có | Repo là React + Vite → nên dùng khi refactor state/props. |
| `web-testing` (Playwright) | Khi form admin phức tạp hơn | Hiện form chỉ có URL text; bật lên khi thêm upload ảnh thật. |

## 8. Việc còn tồn (backlog gợi ý)

- [ ] Upload ảnh trực tiếp thay vì dán link (kèm nén + alt bắt buộc).
- [ ] Trang chi tiết bài viết (deep link `#/tab/id`) để chia sẻ từng mốc lịch sử.
- [ ] Mốc năm tự parse: cho phép lưu `{ yearStart, yearEnd }` thay vì string.
- [ ] Chế độ "toàn màn hình ảnh" (lightbox) cho thư viện tư liệu.
- [ ] Xuất bản PDF "Kỷ yếu" theo khóa.
