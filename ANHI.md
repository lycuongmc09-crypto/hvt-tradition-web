# Cách thêm ẢNH THẬT vào website (Phòng Truyền Thống Online HVT)

Repo hiện **chưa chứa file ảnh nào** (kiểm tra: `find . -iname "*.jpg" -o -iname "*.png"` → trống).
Ảnh đang hiển thị là ảnh minh họa lấy từ Unsplash/Google Drive. Khi bạn có ảnh thật, làm theo 1 trong 3 cách sau — **không cần đổi code** cho cách A và B.

---

## Cách A — Thả file vào repo (khuyên dùng, ảnh được build + tối ưu)

1. Copy ảnh vào thư mục: `src/assets/img/`
   Gợi ý đặt tên không dấu, viết liền: `banner-dinh-ly.jpg`, `logo-hvt.png`, `k12-anchao-2019.jpg`
2. Khai báo key trong `src/assets/images.js`:
   ```js
   export const IMG = {
     bannerDinhLy: new URL('./img/banner-dinh-ly.jpg', import.meta.url).href,
     logoHvt:      new URL('./img/logo-hvt.png', import.meta.url).href,
   };
   ```
3. Dùng key đó ở bất kỳ đâu:
   - Trong Quản Trị → ô "Link ảnh", gõ đúng tên key: `bannerDinhLy`
   - Hoặc sửa trực tiếp `src/data.js` → `DEFAULT_POSTS[i].images: ['bannerDinhLy']`
4. Chạy `npm run build` để kiểm chứng (Vite sẽ in ra dòng `dist/assets/...jpg`).

Ưu điểm: ảnh nằm trong bundle, tên có hash → cache an toàn, không phụ thuộc mạng.

## Cách B — Ảnh tĩnh trong `public/`

1. Copy ảnh vào `public/img/` (vd: `public/img/hoat-dong-2019.jpg`).
2. Dùng thẳng đường dẫn: `/img/hoat-dong-2019.jpg` (dán vào ô link ảnh như một URL bình thường).
3. Hoặc khai báo key trong `PUBLIC_IMG` của `src/assets/images.js` rồi dùng tên key.

Ưu điểm: nhanh, không cần rebuild khi thay nội dung ảnh. Nhược: không tối ưu/nén tự động.

## Cách C — Link Google Drive / YouTube (dành cho tư liệu cũ)

- Dán link chia sẻ Google Drive dạng `.../file/d/<ID>/view` → web tự chuyển thành `https://lh3.googleusercontent.com/d/<ID>`.
- Video YouTube: dán link watch/embed, web tự lấy thumbnail `hqdefault.jpg`.
- Nên bật quyền "Bất kỳ ai có liên kết" để ảnh load được từ hosting khác.

---

## Cơ chế an toàn (`resolveImage`)

Mọi chỗ render ảnh đều đi qua `resolveImage()` trong `src/assets/images.js`:

| Đầu vào | Kết quả |
|---|---|
| key có trong `IMG` | đường dẫn đã bundle |
| key có trong `PUBLIC_IMG` | `/img/...` |
| link `http(s)://`, `/...`, `data:`, `blob:` | giữ nguyên |
| rỗng / key lạ / tải ảnh lỗi | placeholder + `<img onError>` tự fallback |

Nhờ vậy thiếu ảnh không bao giờ làm vỡ giao diện.

## Checklist ảnh nên có cho web truyền thống

- [ ] Ảnh banner trường (bộ đội/cờ/ tượng đài Hoàng Văn Thụ) — ngang, ≥1600px, ~200–400KB
- [ ] Logo trường / huy hiệu Đoàn — PNG nền trong suốt
- [ ] Ảnh tập thể từng khóa (K…) — vuông hoặc 4:3
- [ ] Ảnh thầy cô tiêu biểu — chân dung 3:4
- [ ] Ảnh cơ sở vật chất theo mốc năm (lớp học, sân trường, phòng truyền thống)
- [ ] Scan giấy khen, bằng khen, sổ vàng — sáng, đều sáng, ≥1200px

Sau khi có ảnh: chạy `npm run dev`, mở 7 chuyên mục và kiểm tra alt-text, độ sắc nét trên điện thoại.
