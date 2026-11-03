/**
 * Bộ icon SVG inline (thay cho emoji) — một nguồn duy nhất, dùng được cho cả nút và tab.
 * Kế thừa màu từ `currentColor`, kích thước theo prop `size`.
 */

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5',
  timeline: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
  teacher:
    'M12 3 2 8l10 5 10-5-10-5ZM5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M20 9v6',
  award:
    'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM9 14.5 7.5 22 12 19l4.5 3L15 14.5',
  club:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.2c2.8.4 6 2.4 6 5.8',
  video: 'M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5v9A1.5 1.5 0 0 1 13.5 18h-9A1.5 1.5 0 0 1 3 16.5v-9ZM15 10.5l6-3.5v10l-6-3.5',
  letter:
    'M3 6.5h18v11H3zM3 6.5 12 13l9-6.5',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  lock: 'M7 10.5V8a5 5 0 0 1 10 0v2.5M5.5 10.5h13v9h-13zM12 14v2.5',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4.5h6V7M6.5 7 7.5 20h9L17.5 7',
  edit: 'M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4',
  external: 'M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h6',
  play: 'M8 5.5v13l11-6.5z',
  image: 'M4 5h16v14H4zM4 15l4.5-4.5L14 16l3-3 3 3M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4.5-4.5',
  print: 'M7 8V4h10v4M5 8h14v8h-3v4H8v-4H5z',
  check: 'M5 13l4 4L19 7',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  upload: 'M12 16V4m0 0 4 4m-4-4L8 8M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
  download: 'M12 4v12m0 0 4-4m-4 4-4-4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
  settings: 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M19.4 13a7.9 7.9 0 0 0 0-2l1.8-1.4-2-3.4-2.2.9a8 8 0 0 0-1.7-1L14.9 3h-4l-.4 2.1a8 8 0 0 0-1.7 1l-2.2-.9-2 3.4L4.6 11a7.9 7.9 0 0 0 0 2l-1.8 1.4 2 3.4 2.2-.9a8 8 0 0 0 1.7 1l.4 2.1h4l.4-2.1a8 8 0 0 0 1.7-1l2.2.9 2-3.4L19.4 13Z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  save: 'M5 4h11l3 3v13H5zM8.5 4v6h7V4M8.5 20v-6h7v6',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 10.5V17M12 7.2v.6',
  warning: 'M12 3.5 2.5 20h19zM12 9.5v5M12 17v.6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8, filled = false }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

/** Huy hiệu / logo chữ HVT kiểu con dấu truyền thống. */
export function SchoolSeal({ className = '' }) {
  return (
    <span
      className={`grid place-items-center rounded-md border-2 border-accent/70 bg-primary font-serif font-bold leading-none text-white ${className}`}
      aria-hidden="true"
    >
      HVT
    </span>
  );
}
