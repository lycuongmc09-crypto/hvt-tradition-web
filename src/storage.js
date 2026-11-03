// ---------------------------------------------------------------------------
// src/storage.js – Tầng lưu trữ tập trung (KHÔNG cần sửa code khi cập nhật web)
// ---------------------------------------------------------------------------
// Toàn bộ nội dung website (bài viết, ảnh, video, banner, thông tin trường,
// mật khẩu admin) được quản lý qua trang QUẢN TRỊ và lưu dưới trình duyệt:
//   • localStorage  -> dữ liệu "vĩnh viễn" trên máy đã nhập (load rất nhanh)
//   • IndexedDB     -> bản sao dự phòng + nơi chứa ẢNH UPLOAD (file lớn)
// Khi xóa / đổi máy, chỉ cần Export JSON ở tab "Sao lưu" rồi Import lại.
// ---------------------------------------------------------------------------

const LS_DATA_KEY = 'hvt_site_data_v1';
const LS_PASSWORD_KEY = 'hvt_admin_password_v1';
const IDB_NAME = 'hvt-tradition-media';
const IDB_STORE = 'images';
const DEFAULT_PASSWORD = 'hvt2026';

/** Thông tin chung hiển thị trên web (đổi trực tiếp trong trang Quản trị). */
export const DEFAULT_SCHOOL = {
  name: 'Trường THPT Hoàng Văn Thụ',
  shortName: 'THPT Hoàng Văn Thụ',
  location: 'Phường Vàng Danh, Tỉnh Quảng Ninh',
  foundedYear: 1984,
  contactPhone: '0988.xxx.xxx',
  credit: 'Website số hóa phòng truyền thống do Câu lạc bộ Tin học nhà trường xây dựng và duy trì.',
};

/**
 * Vài mục mẫu để web không bao giờ trắng khi mở lần đầu.
 * Ảnh tham chiếu theo KEY trong thư viện (src/assets/images.js),
 * nên muốn đổi ảnh chỉ việc bấm chọn lại trong trang Quản trị.
 */
export const SEED_DATA = {
  version: 1,
  school: { ...DEFAULT_SCHOOL },
  banner: 'banner',
  logo: 'logo',
  password: DEFAULT_PASSWORD,
  posts: [
    {
      id: 1,
      category: 'Trang Chủ',
      year: '2026 - 2027',
      title: 'Giới thiệu chung về trường THPT Hoàng Văn Thụ',
      content:
        'Trường THPT Hoàng Văn Thụ tọa lạc tại phường Vàng Danh, tỉnh Quảng Ninh, là nơi nuôi dưỡng ước mơ, hoài bão của các thế hệ học sinh.',
      images: ['a1', 'a2'],
      videos: [],
    },
    {
      id: 2,
      category: 'Lịch Sử Hình Thành',
      year: '1984',
      title: 'Thành lập trường',
      content:
        'Những ngày đầu thành lập nhà trường với nhiều khó khăn, thử thách nhưng đầy lòng nhiệt huyết của các thế hệ thầy cô.',
      images: ['a4'],
      videos: [],
    },
    {
      id: 3,
      category: 'Ký ức trường xưa',
      year: 'Khóa K12',
      title: 'Tâm sự tuổi hồng - Mãi nhớ Hoàng Văn Thụ',
      content:
        'Ba năm cấp ba trôi qua nhanh như một giấc mơ. Chúc cho mái trường luôn ngập tràn thành công và các bạn luôn giữ mãi ngọn lửa nhiệt huyết!',
      images: ['a7'],
      videos: [],
    },
  ],
};

let cache = null;

// ===== IndexedDB (chỉ dùng cho file ảnh upload) =====
function openIdb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(id, blob) {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(blob, id);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(id) {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id) {
  const db = await openIdb();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// ===== Đọc / ghi dữ liệu site =====

function normalize(raw) {
  const base = structuredClone(SEED_DATA);
  if (!raw || typeof raw !== 'object') return base;
  return {
    version: 1,
    school: { ...base.school, ...(raw.school || {}) },
    banner: typeof raw.banner === 'string' ? raw.banner : base.banner,
    logo: typeof raw.logo === 'string' ? raw.logo : base.logo,
    password: typeof raw.password === 'string' && raw.password ? raw.password : base.password,
    posts: Array.isArray(raw.posts) ? raw.posts.filter((p) => p && p.title) : base.posts,
  };
}

export function loadSiteData() {
  if (cache) return cache;
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(LS_DATA_KEY));
  } catch {
    parsed = null;
  }
  cache = normalize(parsed);
  if (!parsed) saveSiteData(cache);
  return cache;
}

export function saveSiteData(next) {
  cache = normalize(next);
  try {
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[HVT] Không lưu được vào localStorage (dung lượng đầy?)', e);
  }
  return cache;
}

/** Ghi đè toàn bộ dữ liệu hiện tại bằng một object khác (dùng cho Import / Reset). */
export function replaceSiteData(next) {
  cache = null;
  return saveSiteData(next);
}

export function getPosts() {
  return loadSiteData().posts;
}

export function setPosts(posts) {
  return saveSiteData({ ...loadSiteData(), posts });
}

export function getBanner() {
  return loadSiteData().banner;
}

export function setBanner(value) {
  return saveSiteData({ ...loadSiteData(), banner: value });
}

export function getLogo() {
  return loadSiteData().logo || 'logo';
}

export function setLogo(value) {
  return saveSiteData({ ...loadSiteData(), logo: value || 'logo' });
}

export function getSchool() {
  return { ...DEFAULT_SCHOOL, ...loadSiteData().school };
}

export function setSchool(school) {
  return saveSiteData({ ...loadSiteData(), school: { ...getSchool(), ...school } });
}

// ===== Mật khẩu admin =====

/**
 * Mật khẩu mặc định: "hvt2026".
 * Nếu người dùng từng lưu mật khẩu mới trong trang Quản trị thì dùng mật khẩu đó.
 * (Web tĩnh chạy hoàn toàn trong trình duyệt — đây là lớp chắn cơ bản,
 * không phải bảo mật máy chủ.)
 */
export function verifyAdminPassword(input) {
  if (typeof input !== 'string') return false;
  const stored = localStorage.getItem(LS_PASSWORD_KEY);
  return input === (stored || DEFAULT_PASSWORD);
}

export function changeAdminPassword(newPassword) {
  const clean = String(newPassword || '').trim();
  if (clean.length < 4) return { ok: false, message: 'Mật khẩu mới cần tối thiểu 4 ký tự.' };
  localStorage.setItem(LS_PASSWORD_KEY, clean);
  saveSiteData({ ...loadSiteData(), password: clean });
  return { ok: true, message: `Đã đổi mật khẩu quản trị (${clean.length} ký tự).` };
}

export function resetAdminPassword() {
  localStorage.removeItem(LS_PASSWORD_KEY);
  saveSiteData({ ...loadSiteData(), password: DEFAULT_PASSWORD });
  return { ok: true, message: `Đã khôi phục mật khẩu mặc định “${DEFAULT_PASSWORD}”.` };
}

// ===== Ảnh upload (lưu vĩnh viễn trong IndexedDB) =====

/** Nhận chuỗi mô tả ảnh từ data URL đã nhúng sẵn trong JSON export. */
async function importDataUrlToIdb(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const id = createImageId(blob.type || 'image/jpeg');
  await idbPut(id, blob);
  return id;
}

/** Trả về Blob của ảnh nếu là ảnh upload, ngược lại trả null. */
export async function getImageBlob(ref) {
  if (typeof ref !== 'string') return null;
  const t = ref.trim();
  if (t.startsWith('idb:')) {
    try {
      return await idbGet(t.slice(4));
    } catch {
      return null;
    }
  }
  if (t.startsWith('data:')) {
    try {
      return await (await fetch(t)).blob();
    } catch {
      return null;
    }
  }
  return null;
}

/** Chuyển mọi ảnh dạng data: URL (từ file JSON) sang Blob -> lưu IndexedDB. */
export async function migrateInlineImages(data) {
  const posts = await Promise.all(
    (data?.posts || []).map(async (p) => ({
      ...p,
      images: await Promise.all(
        (p.images || []).map((im) =>
          typeof im === 'string' && im.startsWith('data:') ? importDataUrlToIdb(im) : im,
        ),
      ),
    })),
  );
  const banner =
    typeof data?.banner === 'string' && data.banner.startsWith('data:')
      ? await importDataUrlToIdb(data.banner)
      : data?.banner;
  const logo =
    typeof data?.logo === 'string' && data.logo.startsWith('data:')
      ? await importDataUrlToIdb(data.logo)
      : data?.logo;
  return { ...normalize(data), posts, banner, logo };
}

/** Tạo key lưu trữ cho một File ảnh; kèm phiên bản nhỏ (thumb) để grid mượt. */
export async function addUploadedImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('File không phải là ảnh (JPG/PNG/WebP/GIF).');
  }
  const thumb = await makeThumb(file);
  const id = createImageId(file.type);
  await idbPut(id, file);
  if (thumb) await idbPut(`${id}__thumb`, thumb);
  return `idb:${id}`;
}

export async function removeImageRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('idb:')) return false;
  const id = ref.slice(4);
  await idbDelete(id);
  await idbDelete(`${id}__thumb`);
  return true;
}

/** Đổi Blob thành object URL có thời hạn sống trong phiên làm việc. */
const urlCache = new Map();
export async function getObjectUrl(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('idb:')) return null;
  if (urlCache.has(ref)) return urlCache.get(ref);
  const blob = await getImageBlob(ref);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(ref, url);
  return url;
}

/** Phiên bản thu nhỏ (~560px) tạo bằng canvas — giảm ~80-95% dung lượng. */
async function makeThumb(file, maxSide = 560) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale >= 1) return null;
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    return blob || null;
  } catch {
    return null;
  }
}

function createImageId(type) {
  const ext = (type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg';
  const rnd =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rnd}.${ext}`;
}

// ===== Sao lưu / phục hồi =====

/** Xuất toàn bộ site (kèm cả ảnh upload) thành 1 file JSON tự chứa. */
export async function exportSiteJson() {
  const data = structuredClone(loadSiteData());
  data.exportedAt = new Date().toISOString();

  const refs = new Set();
  data.posts.forEach((p) => (p.images || []).forEach((i) => typeof i === 'string' && refs.add(i)));
  ['banner', 'logo'].forEach((k) => { if (typeof data[k] === 'string') refs.add(data[k]); });

  for (const ref of refs) {
    if (!ref.startsWith('idb:')) continue;
    const blob = await getImageBlob(ref);
    if (!blob) continue; // ảnh mất -> giữ nguyên key, UI sẽ hiện cảnh báo
    const dataUrl = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = () => res(null);
      fr.readAsDataURL(blob);
    });
    if (dataUrl) {
      if (data.banner === ref) data.banner = dataUrl;
      if (data.logo === ref) data.logo = dataUrl;
      data.posts.forEach((p) => {
        p.images = (p.images || []).map((i) => (i === ref ? dataUrl : i));
      });
    }
  }
  return data;
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        resolve(JSON.parse(String(fr.result)));
      } catch {
        reject(new Error('File không phải JSON hợp lệ.'));
      }
    };
    fr.onerror = () => reject(new Error('Không đọc được file.'));
    fr.readAsText(file);
  });
}
