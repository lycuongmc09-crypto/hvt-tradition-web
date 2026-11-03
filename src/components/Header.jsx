import { useEffect, useState } from 'react';
import Icon, { SchoolSeal } from './Icons.jsx';
import SmartImage from './SmartImage.jsx';
import { CATEGORIES, SCHOOL } from '../data.js';

export default function Header({ currentTab, onNavigate, onOpenAdmin, logoRef }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Đóng menu mobile khi bấm Esc
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const go = (cat) => {
    onNavigate(cat);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-accent bg-primary text-white shadow-md">
      {/* Dải trên: tên trường đầy đủ */}
      <div className="bg-primary-dark/80 px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-blue-100 sm:text-xs">
        {SCHOOL.name.toUpperCase()} — {SCHOOL.location.toUpperCase()}
      </div>

      {/* Hàng thương hiệu: logo + nút quản trị */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => go('Trang Chủ')}
          className="flex shrink-0 items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-white/10"
        >
          <SmartImage
            src={logoRef}
            size="thumb"
            alt={`Logo ${SCHOOL.shortName}`}
            eager
            className="h-11 w-11 shrink-0 rounded-full bg-white p-1 shadow-sm ring-1 ring-white/30"
            imgClassName="object-contain"
          />
          <span className="leading-tight">
            <span className="block font-serif text-base font-bold md:text-xl">
              Phòng Truyền Thống Online
            </span>
            <span className="block text-[11px] text-blue-200">
              Không gian số hóa truyền thống nhà trường
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="grid h-11 w-11 place-items-center rounded-lg border border-white/25 bg-blue-900 transition hover:bg-blue-800 lg:hidden"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={22} />
            <span className="sr-only">{mobileOpen ? 'Đóng menu' : 'Mở menu'}</span>
          </button>
        </div>
      </div>

      {/* Thanh chuyên mục (desktop) — một hàng, chia đều */}
      <nav
        aria-label="Chuyên mục chính"
        className="hidden border-t border-white/10 bg-primary-dark/40 lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-stretch justify-between px-2">
          {CATEGORIES.map((cat) => {
            const active = currentTab === cat.id;
            return (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(cat.id);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[15px] font-semibold transition ${
                  active
                    ? 'border-accent bg-white/5 font-semibold text-white'
                    : 'border-transparent text-blue-100 hover:border-white/30 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon name={cat.icon} size={15} />
                {cat.id}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Chuyên mục chính (mobile)"
          className="border-t border-white/10 bg-primary-dark px-4 py-3 lg:hidden"
        >
          <ul className="flex flex-col text-sm">
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <a
                  href={`#${cat.id}`}
                  aria-current={currentTab === cat.id ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(cat.id);
                  }}
                  className={`flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                    currentTab === cat.id
                      ? 'bg-accent font-semibold text-white'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Icon name={cat.icon} size={18} />
                  {cat.id}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
