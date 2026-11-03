import { useEffect, useRef } from 'react';

/**
 * Modal dùng chung cho toàn dự án.
 * - Nhốt focus (focus trap) khi mở
 * - Esc để đóng
 * - Khóa scroll nền
 * - Trả focus về phần tử đã mở modal khi đóng
 */
export default function Modal({ labelledBy, onClose, children, panelClassName = '' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;

    // Focus phần tử đầu tiên có thể tương tác bên trong modal
    const focusables = () =>
      Array.from(
        panel.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const first = focusables()[0];
    if (first) first.focus();
    else panel.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      } else if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-stone-950/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative w-full bg-white rounded-xl shadow-2xl my-8 max-h-[92vh] overflow-y-auto outline-none animate-rise ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Nút đóng form chuẩn (icon + nhãn ẩn cho screen reader). */
export function ModalCloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-3 right-3 z-10 grid place-items-center w-10 h-10 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
      <span className="sr-only">Đóng</span>
    </button>
  );
}
