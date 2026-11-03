import SmartImage from './SmartImage.jsx';
import Icon from './Icons.jsx';

/** Banner đầu trang: ảnh tư liệu lớn + lớp phủ trầm + dòng chữ serif. */
export default function Banner({
  bannerImage,
  eyebrow = 'Không gian số hóa',
  title = 'Phòng Truyền Thống Online',
  subtitle = '',
  compact = false,
}) {
  return (
    <section
      className={`relative isolate flex flex-col justify-end overflow-hidden bg-primary text-white ${
        compact ? 'min-h-[230px] sm:min-h-[280px]' : 'min-h-[340px] sm:min-h-[420px]'
      }`}
    >
      <div className="absolute inset-0 -z-10">
        <SmartImage
          src={bannerImage}
          size="full"
          eager
          alt={title}
          className="h-full w-full"
          imgClassName="object-cover object-bottom scale-[1.35] origin-bottom"
        />
        {/* Lớp phủ chuyển sắc để chữ luôn đủ tương phản trên mọi ảnh */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/70 to-stone-950/30" />
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-accent" />
      </div>

      <div className={`mx-auto w-full max-w-7xl px-4 ${compact ? 'pb-8 pt-12' : 'pb-10 pt-16'}`}>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
          <Icon name="timeline" size={14} />
          {eyebrow}
        </p>
        <h1
          className={`max-w-3xl font-serif font-bold leading-tight drop-shadow-md ${
            compact ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'
          }`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-50/95 drop-shadow sm:text-base">
            {subtitle}
          </p>
        )}
        {!compact && (
          <a
            href="#noi-dung"
            className="no-print mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            Bắt đầu khám phá
            <Icon name="arrowDown" size={16} />
          </a>
        )}
      </div>
    </section>
  );
}
