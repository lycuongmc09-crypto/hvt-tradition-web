import { useRef, useState } from 'react';
import Modal, { ModalCloseButton } from './Modal.jsx';
import Icon from './Icons.jsx';
import SmartImage from './SmartImage.jsx';
import { CATEGORY_NAMES, SCHOOL_YEARS } from '../data.js';
import { addUploadedImage } from '../storage.js';

/** Ảnh có sẵn trong thư viện repo (bỏ cỡ phụ -full/-thumb và logo). */
import { AVAILABLE_IMAGE_KEYS, IMAGE_ALT, imageSrc } from '../assets/images.js';
const LIBRARY = AVAILABLE_IMAGE_KEYS.filter(
  (k) => !k.endsWith('-full') && !k.endsWith('-thumb') && k !== 'logo',
);

export default function PostFormModal({ initial, onClose, onSave }) {
  const editing = Boolean(initial);
  const [draft, setDraft] = useState(() => ({
    category: CATEGORY_NAMES[1],
    year: '',
    title: '',
    content: '',
    images: [],
    videos: [],
    ...(initial || {}),
  }));
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const set = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError('');
  };
  const addImage = (ref) => {
    if (!ref || draft.images.includes(ref)) return;
    set('images', [...draft.images, ref]);
  };
  const moveImage = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= draft.images.length) return;
    const next = [...draft.images];
    [next[i], next[j]] = [next[j], next[i]];
    set('images', next);
  };

  const uploadFiles = async (fileList) => {
    const files = [...(fileList || [])].filter(Boolean);
    if (!files.length) return;
    setBusy(true);
    try {
      const refs = [];
      for (const f of files) refs.push(await addUploadedImage(f));
      set('images', [...draft.images, ...refs]);
    } catch (err) {
      setError(err.message || 'Upload ảnh thất bại.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const videos = (draft.videos || []).map((s) => String(s).trim()).filter(Boolean);
    if (!draft.title.trim()) return setError('Tiêu đề không được để trống.');
    if (!draft.year.trim()) return setError('Vui lòng nhập năm học hoặc mốc năm (VD: 2025 - 2026, 1984, Khóa K12).');
    if (!draft.content.trim()) return setError('Vui lòng viết nội dung cho mục này.');
    if (draft.images.length === 0 && videos.length === 0)
      return setError('Cần ít nhất 1 ảnh hoặc 1 link video minh họa.');

    onSave({
      ...draft,
      id: draft.id ?? Date.now(),
      title: draft.title.trim(),
      year: draft.year.trim(),
      content: draft.content.trim(),
      videos,
    });
  };

  return (
    <Modal labelledBy="post-form-title" onClose={onClose} panelClassName="max-w-3xl p-6 sm:p-8">
      <ModalCloseButton onClick={onClose} />

      <h2 id="post-form-title" className="font-serif text-xl font-bold text-primary">
        {editing ? 'Sửa bài viết / tư liệu' : 'Thêm mục mới'}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-stone-500">
        Upload ảnh từ máy (lưu vĩnh viễn), chọn ảnh có sẵn, hoặc dán link Google Drive — hệ thống tự
        chuyển thành link ảnh trực tiếp. Xem trước ngay bên dưới, không cần sửa code.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="f-cat" className="field-label">Chuyên mục (hiện ở tab nào)</label>
            <select id="f-cat" value={draft.category} onChange={(e) => set('category', e.target.value)} className="field-input">
              {CATEGORY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-year" className="field-label">Năm học / Mốc năm</label>
            <input id="f-year" required value={draft.year} onChange={(e) => set('year', e.target.value)}
              list="f-years" className="field-input font-semibold text-primary" placeholder="VD: 2025 - 2026 hoặc 1984" />
            <datalist id="f-years">{SCHOOL_YEARS.filter((y) => y !== 'Tất cả').map((y) => <option key={y} value={y} />)}</datalist>
          </div>
          <div>
            <label htmlFor="f-title" className="field-label">Tiêu đề</label>
            <input id="f-title" required value={draft.title} onChange={(e) => set('title', e.target.value)}
              className="field-input" placeholder="VD: Lễ kỷ niệm 40 năm thành lập" />
          </div>
        </div>

        <div>
          <label htmlFor="f-content" className="field-label">Nội dung chi tiết</label>
          <textarea id="f-content" rows="4" required value={draft.content} onChange={(e) => set('content', e.target.value)}
            className="field-input resize-y leading-relaxed" placeholder="Ghi lại sự kiện, câu chuyện, thành tích…" />
        </div>

        {/* ===== ẢNH ===== */}
        <fieldset className="rounded-xl border border-stone-200 bg-paper p-4">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-stone-700">
            Ảnh tư liệu ({draft.images.length})
          </legend>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
              className="btn-primary focus-ring inline-flex items-center gap-2 px-3 py-2 text-xs disabled:opacity-50">
              <Icon name="upload" size={15} /> {busy ? 'Đang xử lý…' : 'Upload ảnh từ máy'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only"
              onChange={(e) => uploadFiles(e.target.files)} />
            <span className="text-[11px] leading-8 text-stone-500">hoặc kéo-thả ảnh vào khung bên dưới</span>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('!border-accent', '!bg-accent/5'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('!border-accent', '!bg-accent/5')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('!border-accent', '!bg-accent/5');
              uploadFiles(e.dataTransfer.files);
            }}
            className="mt-2 rounded-lg border border-dashed border-stone-300 px-3 py-3 text-center text-[11px] text-stone-500 transition"
          >
            Thả file ảnh (JPG/PNG/WebP) vào đây để lưu vĩnh viễn vào thư viện
          </div>

          <div className="mt-2 flex gap-2">
            <input value={link} onChange={(e) => setLink(e.target.value)} className="field-input"
              placeholder="Dán link Google Drive / https://…" aria-label="Link ảnh" />
            <button type="button" onClick={() => { addImage(link.trim()); setLink(''); }} className="btn-ghost focus-ring shrink-0">
              <Icon name="plus" size={15} /> Thêm link
            </button>
          </div>

          <p className="field-label mt-3 mb-1.5">Chọn nhanh từ thư viện trường ({LIBRARY.length} ảnh)</p>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {LIBRARY.map((key) => (
              <li key={key}>
                <button type="button" onClick={() => addImage(key)} title={IMAGE_ALT[key] || key}
                  aria-label={`Thêm ảnh ${key}`}
                  className={`block w-full overflow-hidden rounded-lg border-2 bg-white p-1 transition hover:border-accent focus-ring ${
                    draft.images.includes(key) ? 'border-accent' : 'border-stone-300'
                  }`}>
                  <img src={imageSrc(key, 'thumb')} alt="" loading="lazy" className="aspect-square w-full rounded object-cover" />
                  <span className="mt-1 block truncate text-center text-[10px] font-semibold text-stone-600">{key}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Preview thứ tự ảnh sẽ hiển thị trên web */}
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {draft.images.map((ref, i) => (
              <li key={`${ref}-${i}`} className="group relative overflow-hidden rounded-lg ring-1 ring-stone-300">
                <SmartImage src={ref} size="thumb" alt={`Ảnh ${i + 1}`} className="aspect-[4/3] w-full" />
                <span className="absolute left-1 top-1 rounded bg-stone-950/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {i + 1}{i === 0 ? ' · bìa' : ''}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-stone-950/75 px-1 py-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <button type="button" onClick={() => moveImage(i, -1)} className="rounded px-1 text-white hover:bg-white/20" aria-label="Lên trước">
                    <Icon name="chevronLeft" size={13} />
                  </button>
                  <button type="button" onClick={() => set('images', draft.images.filter((_, idx) => idx !== i))}
                    className="rounded px-1 text-red-300 hover:bg-red-500/30" aria-label="Gỡ ảnh">
                    <Icon name="trash" size={13} />
                  </button>
                  <button type="button" onClick={() => moveImage(i, 1)} className="rounded px-1 text-white hover:bg-white/20" aria-label="Xuống sau">
                    <Icon name="chevronRight" size={13} />
                  </button>
                </div>
              </li>
            ))}
            {draft.images.length === 0 && (
              <li className="col-span-full rounded-lg border border-dashed border-stone-300 px-3 py-4 text-center text-xs text-stone-500">
                Chưa chọn ảnh nào — upload, dán link, hoặc bấm ảnh trong thư viện ở trên.
              </li>
            )}
          </ul>
        </fieldset>

        {/* ===== VIDEO ===== */}
        <fieldset className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-primary">Video (YouTube / Drive)</legend>
          <div className="mb-2 flex justify-end">
            <button type="button" onClick={() => set('videos', [...(draft.videos || []), ''])} className="btn-accent focus-ring px-3 py-1.5 text-xs">
              <Icon name="plus" size={14} /> Thêm link video
            </button>
          </div>
          {(draft.videos || []).length === 0 && <p className="text-xs text-stone-500">Chưa có video cho mục này.</p>}
          <ul className="space-y-2">
            {(draft.videos || []).map((url, i) => (
              <li key={i} className="flex items-center gap-2">
                <label htmlFor={`vid-${i}`} className="sr-only">Link video {i + 1}</label>
                <input id={`vid-${i}`} type="url" value={url}
                  onChange={(e) => set('videos', draft.videos.map((v, idx) => (idx === i ? e.target.value : v)))}
                  className="field-input" placeholder="https://www.youtube.com/watch?v=..." />
                <button type="button" onClick={() => set('videos', draft.videos.filter((_, idx) => idx !== i))}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-stone-300 bg-white text-red-700 transition hover:bg-red-50 focus-ring">
                  <Icon name="trash" size={16} />
                  <span className="sr-only">Xóa link video {i + 1}</span>
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost focus-ring">Hủy</button>
          <button type="submit" className="btn-primary focus-ring">
            <Icon name="check" size={16} /> {editing ? 'Lưu thay đổi' : 'Thêm vào phòng truyền thống'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
