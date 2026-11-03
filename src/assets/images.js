// ---------------------------------------------------------------------------
// src/assets/images.js  –  Bản đồ ảnh của website (ảnh THẬT đã có trong repo)
// ---------------------------------------------------------------------------
// Nguồn: thư mục Google Drive "Web" (8 file: a1, a2, anh3, a4, a5, a6, a7,
// logohoangvanthu.png). Ảnh gốc giữ trong `src/assets/img/`; các phiên bản đã
// tối ưu (nhiều cỡ + banner cắt 16:9) nằm trong `public/img/`, tham chiếu qua PUBLIC_IMG.
//
// Thêm ảnh mới: copy vào src/assets/img/, chạy `node scripts/gen-images.mjs`
// để sinh các cỡ, rồi khai báo key ở đây.
// ---------------------------------------------------------------------------

/** Ảnh bundle trực tiếp qua Vite (logo/favicon — cần import thật). */
export const IMG = {
  logoHvt: new URL('./img/logohoangvanthu.png', import.meta.url).href,
};

/** Ảnh tĩnh đã tối ưu trong `public/img/` — không cần build lại khi đổi nội dung. */
export const PUBLIC_IMG = {
  logo: '/img/logo-hvt.png',

  // Banner (đã crop 16:9, 1600x900)
  banner: '/img/banner-a1.jpg',
  bannerA4: '/img/banner-a4.jpg',

  // Bộ ảnh tư liệu — mỗi ảnh 3 cỡ: thumb(480) / mặc định(900) / full(1600)
  a1: '/img/a1-900.jpg',
  a2: '/img/a2-900.jpg',
  a3: '/img/a3-900.jpg',
  a4: '/img/a4-900.jpg',
  a5: '/img/a5-900.jpg',
  a6: '/img/a6-900.jpg',
  a7: '/img/a7-900.jpg',

  'a1-full': '/img/a1-1600.jpg',
  'a2-full': '/img/a2-1600.jpg',
  'a3-full': '/img/a3-1600.jpg',
  'a4-full': '/img/a4-1600.jpg',
  'a5-full': '/img/a5-1600.jpg',
  'a6-full': '/img/a6-1600.jpg',
  'a7-full': '/img/a7-1600.jpg',

  'a1-thumb': '/img/a1-480.jpg',
  'a2-thumb': '/img/a2-480.jpg',
  'a3-thumb': '/img/a3-480.jpg',
  'a4-thumb': '/img/a4-480.jpg',
  'a5-thumb': '/img/a5-480.jpg',
  'a6-thumb': '/img/a6-480.jpg',
  'a7-thumb': '/img/a7-480.jpg',
};

/** Caption gợi ý cho từng ảnh thật (alt-text thân thiện với screen reader). */
export const IMAGE_ALT = {
  a1: 'Quang cảnh sân trường THPT Hoàng Văn Thụ',
  a2: 'Tập thể học sinh nhà trường trong lễ chào cờ',
  a3: 'Hoạt động ngoài trời của Đoàn Trường Hoàng Văn Thụ',
  a4: 'Ngôi trường nhìn từ khuôn viên xanh',
  a5: 'Tiết học trong lớp của thầy và trò',
  a6: 'Không khí giờ ra chơi ở sân trường',
  a7: 'Kỷ niệm một thế hệ học sinh Hoàng Văn Thụ',
  logo: 'Logo trường THPT Hoàng Văn Thụ',
  banner: 'Ảnh toàn cảnh trường dùng làm banner',
};

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

/** Trả về đường dẫn theo cỡ ảnh (thumb | card | full), tự fallback hợp lý. */
export function imageSrc(key, size = 'card') {
  if (!key || typeof key !== 'string') return PLACEHOLDER;
  const k = key.trim();
  const exact = IMG[k] || PUBLIC_IMG[k];
  if (exact) return exact;
  if (size === 'full' && PUBLIC_IMG[`${k}-full`]) return PUBLIC_IMG[`${k}-full`];
  if (size === 'thumb' && PUBLIC_IMG[`${k}-thumb`]) return PUBLIC_IMG[`${k}-thumb`];
  if (/^(https?:|\/|data:|blob:)/i.test(k)) return k;
  return PLACEHOLDER;
}

/**
 * Ưu tiên: 1) key trong IMG  2) key trong PUBLIC_IMG  3) link người dùng dán
 * 4) placeholder — luôn trả chuỗi hợp lệ, không bao giờ rỗng.
 */
export function resolveImage(keyOrUrl) {
  return imageSrc(keyOrUrl, 'card');
}

/** Ảnh bìa có sẵn (16:9) cho trang Quản Trị — bấm là áp dụng. */
export const AVAILABLE_BANNERS = [
  { key: 'banner', label: 'Sân trường (a1)', src: PUBLIC_IMG.banner },
  { key: 'bannerA4', label: 'Khuôn viên (a4)', src: PUBLIC_IMG.bannerA4 },
  { key: 'a4-full', label: 'Ảnh ngang a4', src: PUBLIC_IMG['a4-1600.jpg'] },
  { key: 'a6-full', label: 'Ảnh ngang a6', src: PUBLIC_IMG['a6-1600.jpg'] },
];

/** Danh sách key ảnh có sẵn — dùng cho autocomplete/danh sách ở trang Quản Trị. */
export const AVAILABLE_IMAGE_KEYS = Object.keys(PUBLIC_IMG)
  .filter((k) => !k.endsWith('-full') && !k.endsWith('-thumb'))
  .concat(Object.keys(IMG));

export function hasLocalImages() {
  return Object.keys(IMG).length > 0 || Object.keys(PUBLIC_IMG).length > 0;
}

export { PLACEHOLDER };
