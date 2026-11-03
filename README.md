# hvt-tradition-web

Website **Phòng Truyền Thống Online - THPT Hoàng Văn Thụ**, viết lại từ bản `index37.html` (bản web cô giáo duyệt) bằng **React + Vite + Tailwind CSS**.

## Chạy thử trên máy tính

Cần cài [Node.js](https://nodejs.org) (bản 18 trở lên) trước.

```bash
npm install     # cài thư viện (chỉ cần chạy 1 lần)
npm run dev     # chạy web, mở trình duyệt vào link hiện ra (vd: http://localhost:5173)
```

## Xuất bản web tĩnh để đưa lên hosting (Netlify / Vercel / GitHub Pages ...)

```bash
npm run build   # tạo ra thư mục dist/
```

Thư mục `dist/` chính là website hoàn chỉnh, chỉ việc upload lên hosting.

## Tính năng (giữ nguyên như bản index37)

- 7 chuyên mục: Trang Chủ, Lịch Sử Hình Thành, Thầy Cô Tiêu Biểu, Thành Tích & Khen Thưởng, Hoạt Động & CLB, Video & Tư Liệu, Ký ước trường xưa.
- Lọc theo năm học; dòng thời gian ngang cho mục Lịch Sử; lưới ảnh kỷ niệm cho mục Ký ước.
- Slider ảnh tự động chuyển (3 giây), card video YouTube/Drive có nút mở toàn màn hình.
- Hỗ trợ dán link Google Drive (tự chuyển thành link xem ảnh).
- Chế độ **Quản Trị Admin**: đăng nhập mật khẩu, đổi ảnh banner, thêm/sửa/xóa bài viết, đặt lại dữ liệu mẫu. Dữ liệu lưu trong `localStorage` của trình duyệt (key `hvt_v37_posts`, giống bản cũ nên không mất dữ liệu đã nhập).

## Cấu trúc thư mục

```
src/
  App.jsx                  # logic chính (tab, lọc năm, admin state)
  data.js                  # danh mục, dữ liệu mẫu, tiện ích (Drive/YouTube/mật khẩu)
  components/
    Header.jsx             # thanh điều hướng + menu mobile
    Banner.jsx             # banner lớn trang chủ
    Filters.jsx            # nút tab + chọn năm học
    PostViews.jsx          # TimelineView / MemoryGrid / PostCard (3 kiểu bố cục)
    Media.jsx              # ImageSlider + VideoCard
    LoginModal.jsx         # modal đăng nhập admin
    AdminDashboard.jsx     # bảng quản lý bài viết + đổi banner
    PostFormModal.jsx      # form thêm/sửa bài (ảnh, video)
```

## Ghi chú bảo mật

Mật khẩu admin vẫn dùng logic mã hóa nhị phân như bản gốc (mật khẩu cũ). Cách này **không an toàn thật sự** vì code nằm ở phía trình duyệt — nếu sau này cần bảo mật thật (nhiều admin cùng sửa, dữ liệu chung cho mọi người xem), cần thêm backend (ví dụ Next.js + database). Khi đó chỉ cần đổi cách gọi dữ liệu trong `src/data.js`.
