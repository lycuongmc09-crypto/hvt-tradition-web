// ===== Dữ liệu & hằng số của Phòng Truyền Thống Online - THPT Hoàng Văn Thụ =====

import { getSchool } from './storage.js';

/**
 * Thông tin trường — ĐỌC TỪ trang Quản trị (không cần sửa code khi đổi).
 * Object này được cập nhật mỗi lần lưu trong AdminDashboard nên giá trị
 * luôn đúng với nội dung quản trị viên đã nhập.
 */
export const SCHOOL = new Proxy(
  {},
  {
    get: (_, k) => getSchool()[k],
    ownKeys: () => Reflect.ownKeys(getSchool()),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  },
);

/** Icon SVG (tên) cho từng chuyên mục — thay cho emoji. */
export const CATEGORIES = [
  { id: 'Trang Chủ', icon: 'home' },
  { id: 'Lịch Sử Hình Thành', icon: 'timeline' },
  { id: 'Thầy Cô Tiêu Biểu', icon: 'teacher' },
  { id: 'Thành Tích & Khen Thưởng', icon: 'award' },
  { id: 'Hoạt Động & CLB', icon: 'club' },
  { id: 'Video & Tư Liệu', icon: 'video' },
  { id: 'Ký ức trường xưa', icon: 'letter' },
];

/** Tên chuyên mục thuần (dùng cho form admin & bộ lọc). */
export const CATEGORY_NAMES = CATEGORIES.map((c) => c.id);

/** Các tab không áp dụng bộ lọc năm học. */
export const NO_YEAR_FILTER_TABS = ['Lịch Sử Hình Thành', 'Ký ức trường xưa'];

export const SCHOOL_YEARS = [
  'Tất cả',
  '2026 - 2027',
  '2025 - 2026',
  '2024 - 2025',
  '2023 - 2024',
];

// Banner & bài viết mặc định giờ nằm trong src/storage.js (SEED_DATA).

// ===== Tiện ích =====

// Chuyển link Google Drive sang link xem ảnh trực tiếp.
// Đồng thời cho phép dùng key ảnh cục bộ đã khai báo trong src/assets/images.js
// (vd: "bannerDinhLy") hoặc đường dẫn tĩnh trong public/ (vd: "/img/...").
import { resolveImage } from './assets/images.js';

export function formatGoogleDriveUrl(url) {
  if (!url) return '';
  url = String(url).trim();
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  // key ảnh local / ảnh trong public/ -> đường dẫn thật sau khi build
  return resolveImage(url);
}

export function normalizeYear(str) {
  if (!str) return '';
  return str.replace(/\s+/g, '').replace(/-/g, '-');
}

// Lấy ảnh đại diện (thumbnail) từ link YouTube
export function getYouTubeThumbnail(url) {
  if (!url) return '';
  const ytRegExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const ytMatch = url.match(ytRegExp);
  if (ytMatch && ytMatch[2].length === 11) {
    return `https://img.youtube.com/vi/${ytMatch[2]}/hqdefault.jpg`;
  }
  return '/img/a2-900.jpg'; // ảnh thật của trường thay ảnh minh họa
}

/** Đếm số mốc / bài viết trong một chuyên mục (dùng cho trang chủ & tab). */
export function countByCategory(posts, category) {
  return posts.filter((p) => p.category === category).length;
}

/** Suy ra khóa gần nhất từ năm học hiện tại và năm thành lập. */
export function estimateCurrentKhoa(yearsSinceFounding = null) {
  const base = yearsSinceFounding ?? new Date().getFullYear() - SCHOOL.foundedYear + 1;
  return `Khóa K${Math.max(1, base)}`;
}




