import { CATEGORIES, SCHOOL_YEARS, NO_YEAR_FILTER_TABS } from '../data.js';
import Icon from './Icons.jsx';

/**
 * Thanh điều hướng chuyên mục (tablist chuẩn WAI-ARIA) + bộ lọc năm học.
 * Điều hướng bằng phím mũi tên Trái/Phải như một tablist thật.
 */
export default function Filters({ currentTab, currentYear, onSelectTab, onChangeYear }) {
  const showYearFilter = !NO_YEAR_FILTER_TABS.includes(currentTab);

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = CATEGORIES.findIndex((c) => c.id === currentTab);
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = CATEGORIES[(idx + dir + CATEGORIES.length) % CATEGORIES.length];
    onSelectTab(next.id);
    document.getElementById(`tab-${next.icon}`)?.focus();
  };

  return (
    <div className={`no-print mb-8 border-b border-stone-300 pb-4 ${showYearFilter ? '' : 'lg:hidden'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div
          role="tablist"
          aria-label="Chuyên mục"
          onKeyDown={onKeyDown}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden"
        >
          {CATEGORIES.map((cat) => {
            const active = currentTab === cat.id;
            return (
              <button
                key={cat.id}
                id={`tab-${cat.icon}`}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls="panel-noi-dung"
                tabIndex={active ? 0 : -1}
                onClick={() => onSelectTab(cat.id)}
                className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-sm font-medium leading-tight transition last:col-span-full sm:text-base focus-ring xl:w-auto xl:justify-start ${
                  active
                    ? 'border-primary bg-primary text-white shadow-card'
                    : 'border-stone-300 bg-white text-stone-700 hover:border-primary/50 hover:text-primary'
                }`}
              >
                <Icon name={cat.icon} size={16} />
                <span className="whitespace-nowrap">{cat.id}</span>
              </button>
            );
          })}
        </div>

        {showYearFilter && (
          <div className="flex items-center gap-2">
            <label htmlFor="year-filter" className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-stone-700">
              Năm học
            </label>
            <select
              id="year-filter"
              value={currentYear}
              onChange={(e) => onChangeYear(e.target.value)}
              className="field-input w-auto min-h-[44px] font-semibold text-primary sm:w-52"
            >
              {SCHOOL_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y === 'Tất cả' ? 'Tất cả các năm' : y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
