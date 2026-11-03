import { useEffect, useRef, useState } from 'react';
import Icon from './Icons.jsx';
import SmartImage from './SmartImage.jsx';
import { AVAILABLE_BANNERS, AVAILABLE_IMAGE_KEYS, IMAGE_ALT, imageSrc } from '../assets/images.js';
import { formatGoogleDriveUrl, CATEGORY_NAMES, SCHOOL_YEARS } from '../data.js';
import {
  addUploadedImage,
  changeAdminPassword,
  downloadJson,
  exportSiteJson,
  migrateInlineImages,
  readJsonFile,
  removeImageRef,
  resetAdminPassword,
} from '../storage.js';

const TABS = [
  { id: 'content', label: 'Nội dung', icon: 'list' },
  { id: 'banner', label: 'Ảnh bìa', icon: 'image' },
  { id: 'library', label: 'Thư viện ảnh', icon: 'folder' },
  { id: 'settings', label: 'Cài đặt & bảo mật', icon: 'settings' },
  { id: 'backup', label: 'Sao lưu', icon: 'save' },
];

/** Nhãn ngắn cho từng loại nguồn ảnh — hiện trên thẻ để dễ nhận biết. */
export function refLabel(ref) {
  if (typeof ref !== 'string' || !ref) return 'Trống';
  if (ref.startsWith('idb:')) return 'Ảnh upload (lưu máy này)';
  if (/^https?:/i.test(ref)) return 'Link ngoài';
  return `Ảnh thư viện (${ref})`;
}

let toastSeq = 0;

export default function AdminDashboard({
  site,
  onClose,
  onLogout,
  onChangeBanner,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onChangeSchool,
  onReplaceAll,
  onResetSeed,
}) {
  const posts = site.posts;
  const [tab, setTab] = useState('content');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Tất cả');
  const [sort, setSort] = useState('newest');
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [busy, setBusy] = useState(false);

  const pushToast = (message, tone = 'ok') => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };

  // ===== BANNER =====
  const [bannerDraft, setBannerDraft] = useState(site.banner);
  useEffect(() => setBannerDraft(site.banner), [site.banner]);

  // ===== SETTINGS =====
  const [school, setSchool] = useState(site.school);
  useEffect(() => setSchool(site.school), [site.school]);
  const [pwd, setPwd] = useState({ cur: '', next: '', confirm: '' });

  const fileInput = useRef(null);

  const filtered = posts
    .filter((p) => (catFilter === 'Tất cả' ? true : p.category === catFilter))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${p.title} ${p.category} ${p.year} ${p.content}`.toLowerCase().includes(q);
    })
    .sort((a, b) =>
      sort === 'oldest'
        ? a.id - b.id
        : sort === 'title'
          ? String(a.title).localeCompare(String(b.title), 'vi')
          : b.id - a.id,
    );

  const editingPost = posts.find((p) => p.id === editingId);

  // ===== ACTIONS =====
  const applyBanner = () => {
    onChangeBanner(bannerDraft.trim());
    pushToast('Đã lưu ảnh bìa mới.');
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingPost) return;
    onUpdatePost(editingPost);
    setEditingId(null);
    pushToast('Đã lưu thay đổi bài viết.');
  };

  const patchEdit = (patch) => onUpdatePost({ ...editingPost, ...patch });

  const doDelete = async () => {
    const post = posts.find((p) => p.id === confirmDelete);
    if (post) for (const im of post.images || []) await removeImageRef(im);
    onDeletePost(confirmDelete);
    setConfirmDelete(null);
    pushToast('Đã xóa mục khỏi phòng truyền thống.', 'warn');
  };

  /** Upload 1..n File -> IndexedDB, trả về danh sách key "idb:...". */
  const ingestFiles = async (fileList) => {
    const files = [...(fileList || [])].filter(Boolean);
    if (!files.length) return [];
    setBusy(true);
    try {
      const refs = [];
      for (const f of files) refs.push(await addUploadedImage(f));
      pushToast(`Đã upload và lưu vĩnh viễn ${refs.length} ảnh.`);
      return refs;
    } catch (err) {
      pushToast(err.message || 'Upload thất bại.', 'bad');
      return [];
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const uploadForBanner = async (fileList) => {
    const refs = await ingestFiles(fileList);
    if (refs.length) setBannerDraft(refs[refs.length - 1]);
  };

  const doExport = async () => {
    setBusy(true);
    try {
      const data = await exportSiteJson();
      downloadJson(data, `hvt-tradition-${new Date().toISOString().slice(0, 10)}.json`);
      pushToast('Đã tải file sao lưu .json — hãy cất lên Google Drive/Dropbox.');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const raw = await readJsonFile(file);
      const data = await migrateInlineImages(raw);
      onReplaceAll(data);
    } catch (err) {
      pushToast(err.message || 'Không đọc được file sao lưu.', 'bad');
      setBusy(false);
    }
  };

  const submitPassword = (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) return pushToast('Mật khẩu nhập lại chưa khớp.', 'bad');
    const res = changeAdminPassword(pwd.next);
    pushToast(res.message, res.ok ? 'ok' : 'bad');
    if (res.ok) setPwd({ cur: '', next: '', confirm: '' });
  };

  const usedRefs = new Set(posts.flatMap((p) => p.images || []));
  if (typeof site.banner === 'string') usedRefs.add(site.banner);
  const uploads = uploadsOf(site);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-stone-950/60" onClick={onClose}>
      {/* Toast */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`max-w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lift ${
              t.tone === 'bad' ? 'bg-red-700' : t.tone === 'warn' ? 'bg-amber-700' : 'bg-primary'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <section
        aria-label="Bàn điều khiển quản trị"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-3xl flex-col bg-stone-100 shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-stone-300 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
              <Icon name="lock" size={18} className="text-accent" /> Bàn Điều Khiển
            </h2>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              {posts.length} bài viết · chỉnh sửa được lưu ngay và giữ lâu dài trên máy này
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onLogout} className="btn-ghost focus-ring px-3 py-2 text-xs">Đăng xuất</button>
            <button type="button" onClick={onClose} className="btn-primary focus-ring px-3 py-2 text-xs">
              <Icon name="close" size={15} /> Đóng
            </button>
          </div>
        </header>

        <nav role="tablist" aria-label="Chức năng quản trị" className="flex gap-1 overflow-x-auto border-b border-stone-300 bg-white px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-semibold transition focus-ring ${
                tab === t.id ? 'border-accent text-primary' : 'border-transparent text-stone-500 hover:text-primary'
              }`}
            >
              <Icon name={t.icon} size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-5">
          {/* ==================== NỘI DUNG ==================== */}
          {tab === 'content' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <label htmlFor="adm-search" className="sr-only">Tìm bài viết</label>
                  <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input id="adm-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="field-input pl-9" placeholder="Tìm theo tiêu đề, nội dung, năm…" />
                </div>
                <label htmlFor="adm-cat" className="sr-only">Lọc chuyên mục</label>
                <select id="adm-cat" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="field-input w-auto">
                  <option>Tất cả</option>
                  {CATEGORY_NAMES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <label htmlFor="adm-sort" className="sr-only">Sắp xếp</label>
                <select id="adm-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="field-input w-auto">
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="title">Tiêu đề A→Z</option>
                </select>
                <button type="button" onClick={onAddPost} className="btn-accent focus-ring shrink-0">
                  <Icon name="plus" size={16} /> Thêm bài
                </button>
              </div>

              {editingPost && (
                <form onSubmit={saveEdit} className="space-y-3 rounded-xl border-2 border-accent bg-white p-4 shadow-card">
                  <h3 className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-primary">
                    <span className="inline-flex items-center gap-2"><Icon name="edit" size={16} /> Đang sửa: {editingPost.title}</span>
                    <PreviewBadge post={editingPost} />
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="ed-cat" className="field-label">Chuyên mục</label>
                      <select id="ed-cat" value={editingPost.category} onChange={(e) => patchEdit({ category: e.target.value })} className="field-input">
                        {CATEGORY_NAMES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ed-year" className="field-label">Năm học / mốc năm</label>
                      <input id="ed-year" list="ed-years" value={editingPost.year} onChange={(e) => patchEdit({ year: e.target.value })} className="field-input" />
                      <datalist id="ed-years">{SCHOOL_YEARS.filter((y) => y !== 'Tất cả').map((y) => <option key={y} value={y} />)}</datalist>
                    </div>
                    <div>
                      <label htmlFor="ed-title" className="field-label">Tiêu đề</label>
                      <input id="ed-title" value={editingPost.title} onChange={(e) => patchEdit({ title: e.target.value })} className="field-input" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ed-content" className="field-label">Nội dung</label>
                    <textarea id="ed-content" rows="3" value={editingPost.content} onChange={(e) => patchEdit({ content: e.target.value })} className="field-input resize-y" />
                  </div>
                  <ImageManager images={editingPost.images || []} onChange={(images) => patchEdit({ images })} onUpload={ingestFiles} busy={busy} />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="btn-ghost focus-ring">Đóng form</button>
                    <button type="submit" className="btn-primary focus-ring"><Icon name="check" size={16} /> Lưu thay đổi</button>
                  </div>
                </form>
              )}

              <ul className="space-y-3">
                {filtered.length === 0 && (
                  <li className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
                    Không có bài viết nào khớp bộ lọc hiện tại.
                  </li>
                )}
                {filtered.map((post) => (
                  <li key={post.id} className="rounded-xl border border-stone-300 bg-white p-3 transition hover:border-primary/40">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {(post.images || [])[0] ? (
                          <SmartImage src={post.images[0]} size="thumb" className="h-14 w-20 shrink-0 rounded-lg ring-1 ring-stone-200" alt="" />
                        ) : (
                          <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-400"><Icon name="image" size={20} /></span>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-accent">{post.category}</span>
                            <span className="rounded bg-primary/5 px-2 py-0.5 text-[11px] font-bold text-primary">{post.year}</span>
                            <span className="text-[11px] text-stone-400">{(post.images || []).length} ảnh · {(post.videos || []).length} video</span>
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold text-ink">{post.title}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => setEditingId(post.id)} className="btn-ghost focus-ring px-3 py-2 text-xs">
                          <Icon name="edit" size={15} /> Sửa nhanh
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(post.id)}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50">
                          <Icon name="trash" size={15} /> Xóa
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ==================== ẢNH BÌA ==================== */}
          {tab === 'banner' && (
            <Card title="Ảnh bìa đầu trang"
              desc="Chọn 1 ảnh có sẵn, dán link Google Drive, hoặc upload từ máy. Xem trước bên dưới — bấm “Lưu ảnh bìa” là áp dụng toàn trang.">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input aria-label="Nguồn ảnh bìa" value={bannerDraft} onChange={(e) => setBannerDraft(e.target.value)}
                  className="field-input" placeholder="link Drive / key ảnh (a1, a4…) / idb:…" />
                <button type="button" onClick={applyBanner} className="btn-primary focus-ring shrink-0">
                  <Icon name="check" size={16} /> Lưu ảnh bìa
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr]">
                <div className="overflow-hidden rounded-xl ring-1 ring-stone-200">
                  {bannerDraft ? (
                    <SmartImage src={bannerDraft} size="full" alt="Xem trước ảnh bìa" className="aspect-video w-full" />
                  ) : (
                    <div className="grid aspect-video place-items-center bg-stone-100 text-sm text-stone-500">Chưa chọn ảnh bìa</div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="field-label mb-1">Nguồn hiện dùng</p>
                  <p className="rounded-lg bg-paper px-3 py-2 text-xs font-semibold text-primary">{refLabel(bannerDraft)}</p>
                  <BannerUpload inputRef={fileInput} onFiles={uploadForBanner} busy={busy} />
                  <p className="text-[11px] leading-relaxed text-stone-500">
                    Ảnh upload nằm trong “Thư viện ảnh”, chọn lại lúc nào cũng được.
                  </p>
                </div>
              </div>

              <p className="field-label mt-4 mb-2">Ảnh bìa gợi ý ({AVAILABLE_BANNERS.length})</p>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {AVAILABLE_BANNERS.map((b) => (
                  <li key={b.key}>
                    <button type="button" onClick={() => setBannerDraft(b.key)} aria-pressed={bannerDraft === b.key}
                      className={`w-full overflow-hidden rounded-lg border-2 bg-white p-1 text-left transition focus-ring ${
                        bannerDraft === b.key ? 'border-accent' : 'border-stone-300 hover:border-accent'
                      }`}>
                      <img src={b.src} alt="" loading="lazy" className="aspect-video w-full rounded object-cover" />
                      <span className="mt-1 block truncate text-[10px] font-semibold text-stone-600">{b.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ==================== THƯ VIỆN ẢNH ==================== */}
          {tab === 'library' && (
            <Card title="Thư viện ảnh của website"
              desc="Mọi ảnh trang đang dùng. Ảnh bạn upload được lưu vĩnh viễn trong trình duyệt này (IndexedDB) — nhớ Export .json định kỳ để phòng hờ.">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}
                  className="btn-primary focus-ring inline-flex items-center gap-2 disabled:opacity-50">
                  <Icon name="upload" size={16} /> {busy ? 'Đang xử lý ảnh…' : 'Upload ảnh từ máy (chọn nhiều file)'}
                </button>
                <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only"
                  onChange={(e) => ingestFiles(e.target.files)} />
                <p className="text-xs text-stone-500">{uploads.length} ảnh upload · {AVAILABLE_IMAGE_KEYS.length} ảnh trong repo</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {uploads.map((ref) => (
                  <LibraryTile key={ref} imgRef={ref} tag="Upload" used={usedRefs.has(ref)}
                    onDelete={async () => { await removeImageRef(ref); pushToast('Đã xóa ảnh khỏi thư viện.', 'warn'); }} />
                ))}
                {AVAILABLE_IMAGE_KEYS.filter((k) => k !== 'logo').map((key) => (
                  <LibraryTile key={key} imgRef={key} tag="Repo" used={usedRefs.has(key)} />
                ))}
              </div>

              {uploads.length === 0 && (
                <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs text-stone-600">
                  Chưa có ảnh bạn upload — hiện chỉ có ảnh mẫu trong repo. Bấm nút Upload ở trên để thêm ảnh mới, ảnh sẽ hiện ra ngay tại đây.
                </p>
              )}
            </Card>
          )}

          {/* ==================== CÀI ĐẶT ==================== */}
          {tab === 'settings' && (
            <div className="space-y-5">
              <Card title="Thông tin nhà trường" desc="Các dòng chữ này xuất hiện ở thanh trên cùng, phần banner và footer của website.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['name', 'Tên đầy đủ'],
                    ['shortName', 'Tên viết tắt'],
                    ['location', 'Địa điểm'],
                    ['contactPhone', 'Điện thoại / Zalo'],
                    ['foundedYear', 'Năm thành lập'],
                  ].map(([k, label]) => (
                    <div key={k}>
                      <label htmlFor={`sc-${k}`} className="field-label">{label}</label>
                      <input id={`sc-${k}`} value={school[k] ?? ''} onChange={(e) => setSchool({ ...school, [k]: e.target.value })} className="field-input" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label htmlFor="sc-credit" className="field-label">Dòng tín chỉ (footer)</label>
                    <textarea id="sc-credit" rows="2" value={school.credit ?? ''} onChange={(e) => setSchool({ ...school, credit: e.target.value })} className="field-input resize-y" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-stone-500">
                    Xem thử trên header: <strong className="text-primary">{String(school.name || '').toUpperCase()}</strong>
                  </p>
                  <button type="button" onClick={() => { onChangeSchool(school); pushToast('Đã lưu thông tin nhà trường.'); }} className="btn-primary focus-ring">
                    <Icon name="check" size={16} /> Lưu thông tin
                  </button>
                </div>
              </Card>

              <Card title="Đổi mật khẩu quản trị" desc='Mặc định là "hvt admin". Mật khẩu mới chỉ áp dụng trên máy này; nếu quên, bấm "Khôi phục mặc định".'>
                <form onSubmit={submitPassword} className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="pw-cur" className="field-label">Mật khẩu hiện tại</label>
                    <input id="pw-cur" type="password" autoComplete="current-password" required value={pwd.cur}
                      onChange={(e) => setPwd({ ...pwd, cur: e.target.value })} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor="pw-new" className="field-label">Mật khẩu mới</label>
                    <input id="pw-new" type="password" autoComplete="new-password" required minLength={4} value={pwd.next}
                      onChange={(e) => setPwd({ ...pwd, next: e.target.value })} className="field-input" />
                  </div>
                  <div>
                    <label htmlFor="pw-re" className="field-label">Nhập lại mật khẩu mới</label>
                    <input id="pw-re" type="password" autoComplete="new-password" required value={pwd.confirm}
                      onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} className="field-input" />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:col-span-3">
                    <button type="submit" className="btn-primary focus-ring"><Icon name="lock" size={16} /> Đổi mật khẩu</button>
                    <button type="button" onClick={() => pushToast(resetAdminPassword().message, 'warn')} className="btn-ghost focus-ring">
                      Khôi phục mật khẩu mặc định
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* ==================== SAO LƯU ==================== */}
          {tab === 'backup' && (
            <div className="space-y-5">
              <Card title="Xuất / nhập toàn bộ dữ liệu"
                desc="File .json chứa bài viết + ảnh upload + ảnh bìa + thông tin trường. Đây là cách an toàn nhất để giữ nội dung khi đổi máy hoặc trình duyệt xóa dữ liệu.">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={doExport} disabled={busy} className="btn-accent focus-ring disabled:opacity-50">
                    <Icon name="download" size={16} /> Xuất file sao lưu (.json)
                  </button>
                  <label className="btn-primary focus-ring inline-flex cursor-pointer items-center gap-2">
                    <Icon name="upload" size={16} /> Nhập từ file sao lưu
                    <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => doImport(e.target.files?.[0])} />
                  </label>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-stone-600">Sau khi nhập, trang tự tải lại để hiển thị đúng nội dung vừa khôi phục.</p>
              </Card>

              <Card title="Kiểm tra liên kết ảnh" desc="Rà soát xem có ảnh nào đang hỏng / không tải được không.">
                <BrokenLinks posts={posts} banner={site.banner} />
              </Card>

              <Card title="Vùng nguy hiểm" desc="Quay về bản nội dung mẫu ban đầu. Hãy Export trước khi thao tác.">
                <DangerReset onReset={onResetSeed} onDone={() => pushToast('Đang khôi phục nội dung mẫu…', 'warn')} />
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* CONFIRM DELETE */}
      {confirmDelete != null && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-stone-950/70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="del-title">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lift">
            <h3 id="del-title" className="font-serif text-lg font-bold text-primary">Xóa mục này?</h3>
            <p className="mt-2 text-sm text-stone-600">Hành động không thể hoàn tác. Ảnh upload kèm theo cũng bị gỡ khỏi thư viện.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn-ghost focus-ring">Giữ lại</button>
              <button type="button" onClick={doDelete} autoFocus
                className="focus-ring inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800">
                <Icon name="trash" size={16} /> Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ UI nhỏ ------------------------------ */

function Card({ title, desc, children }) {
  return (
    <section className="rounded-xl border border-stone-300 bg-white p-4 shadow-card">
      <h3 className="font-serif text-base font-bold text-primary">{title}</h3>
      {desc && <p className="mt-1 text-xs leading-relaxed text-stone-600">{desc}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BannerUpload({ inputRef, onFiles, busy }) {
  return (
    <>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
        className="btn-primary focus-ring inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-xs disabled:opacity-50">
        <Icon name="upload" size={15} /> Upload ảnh bìa từ máy
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFiles(e.target.files)} />
    </>
  );
}

/** Quản lý ảnh của một bài viết: kéo-thả, upload, dán link, chọn từ thư viện, đổi thứ tự. */
function ImageManager({ images, onChange, onUpload, busy }) {
  const [link, setLink] = useState('');
  const [picker, setPicker] = useState(false);
  const zone = useRef(null);

  const add = (ref) => {
    if (!ref || images.includes(ref)) return;
    onChange([...images, ref]);
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const removeAt = async (i) => {
    await removeImageRef(images[i]);
    onChange(images.filter((_, idx) => idx !== i));
  };

  const handleFiles = async (fileList) => {
    const refs = await onUpload(fileList);
    if (refs?.length) onChange([...images, ...refs]);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-paper p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-700">Ảnh của bài viết ({images.length})</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPicker((v) => !v)} className="btn-ghost focus-ring px-3 py-1.5 text-xs">
            <Icon name="folder" size={14} /> Chọn từ thư viện
          </button>
          <button type="button" disabled={busy} onClick={() => zone.current?.querySelector('input[type=file]')?.click()}
            className="btn-primary focus-ring px-3 py-1.5 text-xs disabled:opacity-50">
            <Icon name="upload" size={14} /> Upload
          </button>
        </div>
      </div>

      <div
        ref={zone}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('!border-accent'); }}
        onDragLeave={(e) => e.currentTarget.classList.remove('!border-accent')}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('!border-accent');
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed border-stone-300 px-3 py-2 text-center text-[11px] text-stone-500 transition"
      >
        Kéo thả ảnh vào đây, hoặc
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
        <span className="font-semibold text-primary"> bấm Upload</span>
      </div>

      <div className="mt-2 flex gap-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} className="field-input"
          placeholder="Hoặc dán link Google Drive / https…" aria-label="Dán link ảnh" />
        <button type="button" onClick={() => { add(link.trim()); setLink(''); }} className="btn-ghost focus-ring shrink-0">
          <Icon name="plus" size={15} /> Thêm link
        </button>
      </div>

      {picker && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {AVAILABLE_IMAGE_KEYS
            .filter((k) => !k.endsWith('-full') && !k.endsWith('-thumb') && k !== 'logo')
            .map((key) => (
              <li key={key}>
                <button type="button" onClick={() => add(key)} title={`Thêm ${key}: ${IMAGE_ALT[key] || ''}`}
                  className="block w-full overflow-hidden rounded-lg border border-stone-300 bg-white p-1 transition hover:border-accent focus-ring">
                  <img src={imageSrc(key, 'thumb')} alt="" loading="lazy" className="aspect-square w-full rounded object-cover" />
                  <span className="mt-1 block truncate text-center text-[10px] font-semibold text-stone-600">{key}</span>
                </button>
              </li>
            ))}
        </ul>
      )}

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((ref, i) => (
          <li key={`${ref}-${i}`} className="group relative overflow-hidden rounded-lg ring-1 ring-stone-300">
            <SmartImage src={ref} size="thumb" alt={`Ảnh ${i + 1} của bài viết`} className="aspect-[4/3] w-full" />
            <span className="absolute left-1 top-1 rounded bg-stone-950/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">{i + 1}</span>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-stone-950/75 px-1 py-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="rounded px-1 text-white hover:bg-white/20" aria-label="Chuyển lên trước">
                <Icon name="chevronLeft" size={13} />
              </button>
              <span className="truncate text-[9px] text-white/80">{refKind(ref)}</span>
              <button type="button" onClick={() => move(i, 1)} className="rounded px-1 text-white hover:bg-white/20" aria-label="Chuyển xuống sau">
                <Icon name="chevronRight" size={13} />
              </button>
              <button type="button" onClick={() => removeAt(i)} className="rounded px-1 text-red-300 hover:bg-red-500/30" aria-label="Gỡ ảnh này">
                <Icon name="trash" size={13} />
              </button>
            </div>
          </li>
        ))}
        {images.length === 0 && (
          <li className="col-span-full rounded-lg border border-dashed border-stone-300 px-3 py-4 text-center text-xs text-stone-500">
            Bài viết chưa có ảnh — upload, dán link hoặc chọn từ thư viện ở trên.
          </li>
        )}
      </ul>
    </div>
  );
}

function refKind(ref) {
  if (String(ref).startsWith('idb:')) return 'upload';
  if (/^https?:/i.test(ref)) return 'link';
  return 'repo';
}

/** Cho biết bài đang hiển thị ở đâu trên web. */
function PreviewBadge({ post }) {
  const where = post.category === 'Trang Chủ' ? 'trang chủ' : `tab “${post.category}”`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/15">
      <Icon name="eye" size={13} /> Hiện ở {where}
    </span>
  );
}

function uploadsOf(site) {
  const refs = new Set();
  (site.posts || []).forEach((p) =>
    (p.images || []).forEach((i) => typeof i === 'string' && i.startsWith('idb:') && refs.add(i)),
  );
  if (typeof site.banner === 'string' && site.banner.startsWith('idb:')) refs.add(site.banner);
  return [...refs];
}

function LibraryTile({ imgRef, tag, used, onDelete }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-300 bg-white">
      <SmartImage src={imgRef} size="thumb" alt={`Ảnh ${imgRef}`} className="aspect-square w-full" />
      <div className="flex items-center justify-between gap-1 px-2 py-1.5">
        <span className="truncate text-[10px] font-semibold text-stone-600" title={imgRef}>{String(imgRef).slice(0, 14)}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${used ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
          {used ? 'đang dùng' : tag}
        </span>
        {onDelete && (
          <button type="button" onClick={onDelete} className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50 focus-ring" aria-label="Xóa ảnh">
            <Icon name="trash" size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Rà soát ảnh hỏng: thử tải từng nguồn, báo đỏ cái không xem được. */
function BrokenLinks({ posts, banner }) {
  const [results, setResults] = useState({});
  const items = [
    { ref: banner, where: 'Ảnh bìa' },
    ...posts.flatMap((p) => (p.images || []).map((i) => ({ ref: i, where: p.title }))),
  ].filter((x) => x.ref);

  const check = async () => {
    setResults({});
    for (const { ref } of items) {
      const ok = await new Promise((res) => {
        if (String(ref).startsWith('idb:')) return res(true);
        const img = new Image();
        img.onload = () => res(true);
        img.onerror = () => res(false);
        img.src = formatGoogleDriveUrl(ref) || ref;
      });
      setResults((r) => ({ ...r, [ref]: ok }));
    }
  };

  const bad = Object.values(results).filter((v) => v === false).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={check} className="btn-primary focus-ring"><Icon name="search" size={16} /> Kiểm tra {items.length} ảnh</button>
        {Object.keys(results).length > 0 && (
          <p role="status" className={`text-sm font-semibold ${bad ? 'text-red-700' : 'text-emerald-700'}`}>
            {bad ? `${bad} ảnh không tải được — hãy thay bằng ảnh khác.` : 'Tất cả ảnh đều hiển thị tốt.'}
          </p>
        )}
      </div>
      <ul className="mt-3 space-y-1 text-xs">
        {items.map(({ ref, where }, i) =>
          results[ref] === false ? (
            <li key={`${ref}-${i}`} className="flex items-center gap-2 rounded bg-red-50 px-2 py-1 text-red-800">
              <Icon name="warning" size={14} /> <span className="font-semibold">{where}</span> — {String(ref).slice(0, 40)}
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

function DangerReset({ onReset, onDone }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)}
        className="focus-ring inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50">
        <Icon name="warning" size={16} /> Khôi phục nội dung mẫu
      </button>
    );
  }
  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3">
      <p className="text-sm font-semibold text-red-800">Bạn chắc chắn? Toàn bộ bài viết và cấu hình hiện tại sẽ bị ghi đè bằng bản mẫu.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setArmed(false)} className="btn-ghost focus-ring">Hủy, quay lại</button>
        <button type="button" onClick={() => { onReset(); setArmed(false); onDone(); setTimeout(() => window.location.reload(), 500); }}
          className="focus-ring rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
          Đồng ý khôi phục
        </button>
      </div>
    </div>
  );
}
