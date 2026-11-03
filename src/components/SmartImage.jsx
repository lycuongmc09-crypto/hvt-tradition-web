import { useEffect, useState } from 'react';
import { getObjectUrl } from '../storage.js';

/**
 * Ảnh của website — tự xử lý 3 loại nguồn:
 *   • key thư viện repo ("a1", "banner")  -> ảnh đã tối ưu trong public/img
 *   • link ngoài (Google Drive / https)   -> tải trực tiếp
 *   • ảnh upload ("idb:...")              -> đọc từ IndexedDB (lưu vĩnh viễn)
 * Có skeleton khi đang tải và ảnh dự phòng khi link hỏng => UI không bao giờ vỡ.
 */
export default function SmartImage({
  src,
  alt = '',
  size = 'card',
  className = '',
  imgClassName = '',
  eager = false,
  sizes,
}) {
  const [resolved, setResolved] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | error

  useEffect(() => {
    let alive = true;
    setState('loading');
    setResolved(null);
    if (!src) {
      if (alive) {
        setResolved(null);
        setState('error');
      }
      return undefined;
    }
    (async () => {
      const url = await getObjectUrl(src); // null nếu không phải ảnh upload
      if (!alive) return;
      if (url) {
        setResolved(url);
        setState('ok');
      } else {
        // import động để tránh vòng lặp module
        const [{ imageSrc }, { formatGoogleDriveUrl }] = await Promise.all([
          import('../assets/images.js'),
          import('../data.js'),
        ]);
        if (!alive) return;
        setResolved(imageSrc(formatGoogleDriveUrl(src), size));
        setState('ok');
      }
    })();
    return () => {
      alive = false;
    };
  }, [src, size]);

  const failed = state === 'error' || !resolved;

  return (
    <div className={`relative overflow-hidden bg-stone-200 ${className}`}>
      {/* Skeleton trong lúc chờ đọc ảnh từ IndexedDB */}
      {state === 'loading' && (
        <span className="absolute inset-0 animate-pulse bg-gradient-to-br from-stone-200 to-stone-300" aria-hidden="true" />
      )}
      <img
        src={failed ? FALLBACK : resolved}
        alt={alt}
        width={size === 'thumb' ? 480 : size === 'full' ? 1600 : 900}
        height={size === 'thumb' ? 480 : size === 'full' ? 900 : 675}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        onError={() => setState('error')}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          state === 'loading' ? 'opacity-0' : 'opacity-100'
        } ${imgClassName}`}
      />
    </div>
  );
}

/** Ảnh dự phòng: logo trường (luôn có trong repo). */
const FALLBACK = '/img/logo-hvt.png';
