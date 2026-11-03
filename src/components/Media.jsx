import { useCallback, useEffect, useState } from 'react';
import { formatGoogleDriveUrl, getYouTubeThumbnail } from '../data.js';
import { imageSrc, PLACEHOLDER } from '../assets/images.js';
import SmartImage from './SmartImage.jsx';
import Icon from './Icons.jsx';

/** Tôn trọng cài đặt "giảm chuyển động" của hệ điều hành. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Lightbox xem ảnh toàn màn hình (Esc đóng, prev/next bằng phím). */
function Lightbox({ images, index, onClose, onIndex }) {
  const reduced = usePrefersReducedMotion();
  const total = images.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % total);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + total) % total);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, total, onClose, onIndex]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-stone-950/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh tư liệu toàn màn hình"
      onClick={onClose}
    >
      <SmartImage
        src={images[index].ref ?? images[index].full}
        size="full"
        eager
        alt={images[index].alt}
        className={`max-h-[78vh] w-auto rounded bg-transparent ${reduced ? '' : 'animate-rise'}`}
        imgClassName="object-contain"
      />
      <div className="mt-4 flex items-center gap-3 text-white" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-ghost !bg-white/10 !border-white/25 !text-white" onClick={() => onIndex((index - 1 + total) % total)}>
          <Icon name="chevronLeft" size={18} /> <span className="sr-only">Ảnh trước</span>
        </button>
        <span className="text-sm tabular-nums">{index + 1} / {total}</span>
        <button type="button" className="btn-ghost !bg-white/10 !border-white/25 !text-white" onClick={() => onIndex((index + 1) % total)}>
          <Icon name="chevronRight" size={18} /> <span className="sr-only">Ảnh tiếp theo</span>
        </button>
        <button type="button" className="btn-ghost !bg-white/10 !border-white/25 !text-white" onClick={onClose}>
          <Icon name="close" size={18} /> Đóng
        </button>
      </div>
    </div>
  );
}

/** Slider ảnh tự động chuyển, pause khi hover/focus; dùng responsive <picture>. */
export function ImageSlider({ images, alt = 'Ảnh tư liệu nhà trường' }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const reduced = usePrefersReducedMotion();
  const count = images.length;

  useEffect(() => {
    if (count <= 1 || paused || reduced || zoomed) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 4500);
    return () => clearInterval(timer);
  }, [count, paused, reduced, zoomed]);

  const step = useCallback((dir) => setIndex((i) => (i - dir + count + count) % count), [count]);

  if (count === 0) return null;

  return (
    <figure
      className="group relative overflow-hidden bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live={reduced ? 'off' : 'polite'}
      >
        {images.map((img, i) => (
          <div key={i} className="flex w-full shrink-0 items-center justify-center bg-white p-4">
            {String(img.ref || '').startsWith('idb:') ? (
              <SmartImage
                src={img.ref}
                size="card"
                eager={i === 0}
                alt={`${alt} — ảnh ${i + 1}/${count}`}
                className="archive-frame max-h-[480px] w-auto max-w-full"
                imgClassName="cursor-zoom-in object-contain"
              />
            ) : (
            <picture>
              {img.thumb && img.thumb !== img.card && (
                <source media="(max-width: 639px)" srcSet={img.thumb} />
              )}
              {img.full && img.full !== img.card && (
                <source media="(min-width: 1280px)" srcSet={img.full} />
              )}
              <img
                src={img.card}
                srcSet={`${img.thumb || img.card} 480w, ${img.card} 900w, ${img.full || img.card} 1600w`}
                sizes="(max-width: 640px) 92vw, (max-width: 1280px) 640px, 820px"
                alt={`${alt} — ảnh ${i + 1}/${count}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                width={900}
                height={675}
                onError={(e) => {
                  if (e.currentTarget.dataset.fallback !== '1') {
                    e.currentTarget.dataset.fallback = '1';
                    e.currentTarget.removeAttribute('srcset');
                    e.currentTarget.src = PLACEHOLDER;
                  }
                }}
                className="archive-frame max-h-[480px] w-auto max-w-full cursor-zoom-in object-contain"
                onClick={() => setZoomed(true)}
              />
            </picture>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(1)}
            className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-stone-900/60 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-stone-900"
          >
            <Icon name="chevronLeft" size={18} />
            <span className="sr-only">Ảnh trước</span>
          </button>
          <button
            type="button"
            onClick={() => step(-1)}
            className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-stone-900/60 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-stone-900"
          >
            <Icon name="chevronRight" size={18} />
            <span className="sr-only">Ảnh tiếp theo</span>
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-accent' : 'w-2 bg-stone-400 hover:bg-stone-600'}`}
              />
            ))}
          </div>
          <span className="absolute bottom-3 right-3 rounded-full bg-stone-900/70 px-2 py-0.5 text-[11px] tabular-nums text-white">
            {index + 1}/{count}
          </span>
        </>
      )}

      {zoomed && (
        <Lightbox images={images} index={index} onIndex={setIndex} onClose={() => setZoomed(false)} />
      )}
    </figure>
  );
}

/** Card video: thumbnail YouTube + mở lightbox iframe (kèm rel an toàn). */
function VideoCard({ url, title }) {
  const [open, setOpen] = useState(false);
  const isEmbeddable = /youtu\.?be/.test(url);
  const thumb = getYouTubeThumbnail(url);

  return (
    <div className="relative w-full overflow-hidden bg-stone-950">
      <button
        type="button"
        onClick={() => (isEmbeddable ? setOpen(true) : window.open(url, '_blank', 'noopener'))}
        className="group relative block h-64 w-full md:h-80"
      >
        <img
          src={thumb}
          alt={title ? `Video: ${title}` : 'Video tư liệu nhà trường'}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
        />
        <span className="absolute inset-0 grid place-items-center bg-stone-950/35 transition group-hover:bg-stone-950/20">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-white shadow-lift transition group-hover:scale-110">
            <Icon name="play" size={30} filled />
          </span>
        </span>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-stone-900/75 px-4 py-1.5 text-xs font-semibold text-white">
          Bấm để xem video chất lượng cao
        </span>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-950 px-4 py-2.5 text-xs">
        <span className="flex items-center gap-2 font-medium text-blue-100">
          <Icon name="video" size={16} />
          Tư liệu video chính thức nhà trường
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-accent focus-ring px-3 py-1.5 text-xs">
          Mở toàn màn hình <Icon name="external" size={14} />
        </a>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-stone-950/95 p-4" role="dialog" aria-modal="true" aria-label="Video tư liệu">
          <div className="aspect-video w-full max-w-5xl">
            <iframe
              src={url.replace('watch?v=', 'embed/')}
              title={title || 'Video tư liệu nhà trường'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-lg"
            />
          </div>
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost absolute top-5 right-5 !bg-white/10 !border-white/25 !text-white">
            <Icon name="close" size={18} /> Đóng
          </button>
        </div>
      )}
    </div>
  );
}

export function MediaContent({ post }) {
  // Mỗi ảnh -> object {card, thumb, full, alt}.
  // card/thumb/full giữ nguyên REF (key repo / link / idb:...) — SmartImage tự phân giải.
  const images = (post.images || []).map((src, i) => ({
    ref: src,
    card: formatGoogleDriveUrl(src),
    thumb: guessKey(src) ? imageSrc(guessKey(src), 'thumb') : formatGoogleDriveUrl(src),
    full: guessKey(src) ? imageSrc(guessKey(src), 'full') : formatGoogleDriveUrl(src),
    alt: `${post.title || 'Ảnh tư liệu'} — ảnh ${i + 1}`,
  }));
  const videos = post.videos || [];

  if (images.length === 0 && videos.length === 0) {
    return (
      <div className="grid h-64 place-items-center bg-stone-100 text-stone-500 md:h-80">
        <span className="flex flex-col items-center gap-2 text-sm">
          <Icon name="image" size={28} />
          Chưa có ảnh hoặc video cho mục này
        </span>
      </div>
    );
  }

  return (
    <>
      {images.length > 0 && <ImageSlider images={images} alt={post.title} />}
      {videos.map((v, i) => (
        <VideoCard key={`${v}-${i}`} url={v} title={post.title} />
      ))}
    </>
  );
}

/** Đoán key ảnh cục bộ từ đường dẫn "/img/a3-900.jpg" -> "a3". */
function guessKey(src) {
  const m = String(src || '').match(/\/img\/([a-z0-9]+)-\d+\./i);
  return m ? m[1] : null;
}
