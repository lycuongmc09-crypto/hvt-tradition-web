import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, SCHOOL } from '../data.js';
import SmartImage from './SmartImage.jsx';
import { MediaContent } from './Media.jsx';
import Icon from './Icons.jsx';

// Ảnh dự phòng cho "Ký ức trường xưa": dùng ảnh THẬT a7 trong repo.
const KY_UOC_FALLBACK_IMG = '/img/a7-900.jpg';

/** Hiện dần khi cuộn (IntersectionObserver), tự tắt nếu reduced-motion. */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = '', as: Tag = 'div' }) {
  const [ref, visible] = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </Tag>
  );
}

/** Trích năm (số) từ chuỗi "năm học" để sắp xếp dòng thời gian đúng thứ tự. */
function extractYear(str) {
  const m = String(str || '').match(/\d{4}/);
  return m ? Number(m[0]) : null;
}

// ===== 1. DÒNG THỜI GIAN cho mục "Lịch Sử Hình Thành" =====
export function TimelineView({ posts }) {
  const scrollRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sorted = [...posts].sort(
    (a, b) => (extractYear(a.year) ?? 9999) - (extractYear(b.year) ?? 9999) || a.id - b.id,
  );

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [posts.length]);

  const scrollBy = (dir) => scrollRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });

  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollBy(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollBy(-1); }
  };

  return (
    <section aria-labelledby="timeline-heading" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card sm:p-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Icon name="timeline" size={16} /> Dòng thời gian
          </p>
          <h2 id="timeline-heading" className="mt-1 font-serif text-xl font-bold text-primary sm:text-2xl">
            Lịch sử phát triển của {SCHOOL.name}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {sorted.length} mốc son · kéo ngang hoặc dùng phím mũi tên để xem tiếp
          </p>
        </div>
        <div className="no-print flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} disabled={atStart}
            className="grid h-11 w-11 place-items-center rounded-full border border-stone-300 bg-white text-primary transition hover:bg-stone-100 disabled:opacity-35 focus-ring">
            <Icon name="chevronLeft" size={18} /><span className="sr-only">Cuộn về mốc cũ hơn</span>
          </button>
          <button type="button" onClick={() => scrollBy(1)} disabled={atEnd}
            className="grid h-11 w-11 place-items-center rounded-full border border-stone-300 bg-white text-primary transition hover:bg-stone-100 disabled:opacity-35 focus-ring">
            <Icon name="chevronRight" size={18} /><span className="sr-only">Cuộn tới mốc mới hơn</span>
          </button>
        </div>
      </header>

      <ol
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={onKey}
        aria-label="Các mốc thời gian tiêu biểu"
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 outline-offset-4"
      >
        {sorted.map((post, idx) => {
          const firstImg = (post.images || [])[0];
          return (
            <li key={post.id} className="relative flex min-w-[290px] max-w-[340px] shrink-0 snap-start flex-col md:min-w-[340px]">
              {/* Trục + nút mốc */}
              <div className="flex items-center gap-2 py-4">
                <span className="h-px flex-1 bg-stone-300" aria-hidden="true" />
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-accent bg-white font-serif text-sm font-bold text-accent tabular-nums">
                  {idx + 1}
                </span>
                <span className="h-px flex-1 bg-stone-300" aria-hidden="true" />
              </div>

              <Reveal className="flex flex-1 flex-col justify-between rounded-xl border border-stone-200 bg-paper p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                    <Icon name="timeline" size={13} /> Năm {post.year}
                  </span>
                  <h3 className="mt-3 font-serif text-lg font-bold leading-snug text-primary">{post.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">{post.content}</p>
                </div>
                {firstImg && (
                  <figure className="archive-frame mt-4 h-40 overflow-hidden">
                    <SmartImage
                      src={firstImg}
                      size="thumb"
                      alt={`Tư liệu năm ${post.year}: ${post.title}`}
                      className="h-full w-full"
                      imgClassName="object-cover"
                    />
                  </figure>
                )}
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ===== 2. LƯỚI KỶ NIỆM cho mục "Ký ức trường xưa" =====
export function MemoryGrid({ posts }) {
  return (
    <section aria-label="Góc ký ức các khóa" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const mainImg = (post.images || [])[0] ?? KY_UOC_FALLBACK_IMG;
        return (
          <Reveal key={post.id} as="article" className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <div className="relative h-56 overflow-hidden">
              <SmartImage
                src={mainImg}
                size="card"
                alt={`Kỷ niệm ${post.year}: ${post.title}`}
                className="h-full w-full"
                imgClassName="object-cover transition duration-500 hover:scale-[1.04]"
              />
              <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                {post.year}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-serif text-lg font-bold leading-snug text-primary">{post.title}</h3>
              <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-stone-700">{post.content}</p>
            </div>
            <footer className="flex items-center justify-between border-t border-stone-200 bg-paper px-5 py-3 text-xs font-medium text-stone-600">
              <span className="inline-flex items-center gap-1.5"><Icon name="letter" size={14} /> Góc kỷ niệm</span>
              <span className="font-bold text-primary">{SCHOOL.shortName}</span>
            </footer>
          </Reveal>
        );
      })}
    </section>
  );
}

// ===== 3. CARD BÀI VIẾT (bố cục đổi theo chuyên mục) =====
function Meta({ post, note }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4 text-xs text-stone-600">
      <span className="font-semibold text-primary">{SCHOOL.shortName}</span>
      <span>{note}</span>
    </div>
  );
}

function Badges({ post }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="rounded bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent ring-1 ring-inset ring-accent/25">
        {post.category}
      </span>
      <span className="rounded bg-primary/5 px-2.5 py-1 text-[11px] font-bold text-primary ring-1 ring-inset ring-primary/15">
        Năm học: {post.year}
      </span>
    </div>
  );
}

export function PostCard({ post, currentTab }) {
  const media = <MediaContent post={post} />;

  if (currentTab === 'Thành Tích & Khen Thưởng') {
    return (
      <Reveal as="article" className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-card lg:grid lg:grid-cols-12">
        <div className="flex flex-col justify-between border-b border-stone-200 p-6 sm:p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
          <div>
            <Badges post={post} />
            <h3 className="mt-2 flex items-start gap-2 font-serif text-xl font-bold text-primary sm:text-2xl">
              <Icon name="award" size={22} className="mt-0.5 shrink-0 text-accent" />
              <span>{post.title}</span>
            </h3>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-stone-800">{post.content}</p>
          </div>
          <Meta post={post} note="Bảng vàng thành tích" />
        </div>
        <div className="bg-stone-50 lg:col-span-7">{media}</div>
      </Reveal>
    );
  }

  if (currentTab === 'Hoạt Động & CLB') {
    return (
      <Reveal as="article" className="overflow-hidden rounded-xl border-2 border-primary/15 bg-white shadow-card lg:grid lg:grid-cols-12">
        <div className="lg:col-span-6 lg:border-r lg:border-primary/10">{media}</div>
        <div className="flex flex-col justify-between bg-gradient-to-br from-white to-paper p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                <Icon name="club" size={13} /> {post.category}
              </span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">Năm học: {post.year}</span>
            </div>
            <h3 className="mt-2 font-serif text-xl font-bold text-primary sm:text-2xl">{post.title}</h3>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-stone-800">{post.content}</p>
          </div>
          <Meta post={post} note="Sáng tạo & Năng động" />
        </div>
      </Reveal>
    );
  }

  // Mặc định: ảnh trái, chữ phải
  return (
    <Reveal as="article" className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-card lg:grid lg:grid-cols-12">
      <div className="lg:col-span-7 lg:border-r lg:border-stone-200">{media}</div>
      <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
        <div>
          <Badges post={post} />
          <h3 className="mt-2 font-serif text-xl font-bold text-primary sm:text-2xl">{post.title}</h3>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-stone-800">{post.content}</p>
        </div>
        <Meta post={post} note="Ban quản trị phòng truyền thống" />
      </div>
    </Reveal>
  );
}

// Ảnh đại diện cho từng chuyên mục trên trang chủ (dùng ảnh thật của trường).
const CAT_IMG = {
  'Trang Chủ': 'a1',
  'Lịch Sử Hình Thành': 'a1',
  'Thầy Cô Tiêu Biểu': 'a5',
  'Thành Tích & Khen Thưởng': 'a4',
  'Hoạt Động & CLB': 'a2',
  'Video & Tư Liệu': 'a6',
  'Ký ức trường xưa': 'a7',
};
export function HomeIntro({ posts, onSelectTab }) {
  const milestones = posts.filter((p) => p.category === 'Lịch Sử Hình Thành');
  const memories = posts.filter((p) => p.category === 'Ký ức trường xưa');
  const teachers = posts.filter((p) => p.category === 'Thầy Cô Tiêu Biểu');

  const stats = [
    { label: 'Năm thành lập', value: SCHOOL.foundedYear, icon: 'timeline' },
    { label: 'Mốc lịch sử', value: milestones.length, icon: 'award' },
    { label: 'Thầy cô tiêu biểu', value: teachers.length, icon: 'teacher' },
    { label: 'Ký ức các khóa', value: memories.length, icon: 'letter' },
  ];

  return (
    <div className="space-y-10">
      <Reveal className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Lời mở đầu</p>
        <h2 className="mt-2 max-w-prose font-serif text-2xl font-bold leading-snug text-primary sm:text-3xl">
          Nơi ký ức của nhiều thế hệ Hoàng Văn Thụ cùng lên tiếng
        </h2>
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-stone-800">
          Từ những ngày đầu trên mảnh đất Vàng Danh đến hôm nay, mỗi thế hệ thầy và trò nhà trường đều
          để lại một dấu ấn. Phòng truyền thống số này gom những dấu ấn ấy thành một hành trình liền mạch —
          ai cũng có thể tìm thấy mình trong đó.
        </p>
        <dl className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex h-full flex-col justify-between rounded-xl border border-stone-200 bg-paper p-4">
              <dt className="flex items-start gap-1.5 text-[11px] font-semibold uppercase leading-snug tracking-wide text-stone-600">
                <Icon name={s.icon} size={14} className="mt-0.5 shrink-0 text-accent" /> {s.label}
              </dt>
              <dd className="mt-2 font-serif text-2xl font-bold tabular-nums text-primary">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <div>
        <h2 className="mb-4 text-xl font-bold text-primary">Khám phá theo chuyên mục</h2>
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(
            posts.reduce((acc, p) => {
              acc[p.category] = (acc[p.category] || 0) + 1;
              return acc;
            }, {}),
          ).map(([cat, n]) => {
            const icon = CATEGORIES.find((c) => c.id === cat)?.icon ?? 'image';
            return (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => onSelectTab(cat)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift focus-ring"
                >
                  <span className="flex items-center gap-3">
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/5 text-primary ring-1 ring-inset ring-primary/10 transition group-hover:ring-primary/30">
                      <SmartImage
                        src={CAT_IMG[cat] ?? 'a1'}
                        size="thumb"
                        alt={cat}
                        className="h-full w-full"
                        imgClassName="object-cover"
                      />
                      <Icon name={icon} size={16} className="absolute text-white drop-shadow" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{cat}</span>
                      <span className="block text-xs text-stone-600">{n} mục đã lưu</span>
                    </span>
                  </span>
                  <Icon name="chevronRight" size={18} className="text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
