import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMonthYear, formatYear, monthGrid, monthShortNames, parseLocalDate, shiftDate, todayLocal, weekdayNames } from '../../lib/dates';
import { Icons } from '../icons';

interface CalendarProps {
  value: string;
  min?: string;
  max?: string;
  onSelect: (date: string) => void;
  /** Shown when the field may be left empty. */
  onClear?: () => void;
}

const navButton =
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black focus-visible:outline-2 focus-visible:outline-brand';

/** A month grid with quick picks. Arrow keys move between days, PageUp and PageDown between months. */
export const Calendar: React.FC<CalendarProps> = ({ value, min, max, onSelect, onClear }) => {
  const { t, language } = useApp();
  const today = todayLocal();
  const start = value || today;
  const [view, setView] = useState(() => {
    const d = parseLocalDate(start);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [focus, setFocus] = useState(start);
  // Days is the normal view; the title opens months, and the year in that view opens a list of years
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearsFrom, setYearsFrom] = useState(view.y - 5);
  const gridRef = useRef<HTMLDivElement>(null);
  const byKeyboard = useRef(false);

  const disabled = (d: string) => (!!min && d < min) || (!!max && d > max);
  const days = monthGrid(view.y, view.m);
  const names = weekdayNames(language);
  const months = monthShortNames(language);

  const showMonthOf = (d: string) => {
    const date = parseLocalDate(d);
    setView({ y: date.getFullYear(), m: date.getMonth() });
  };
  const stepMonth = (by: number) => {
    const d = new Date(view.y, view.m + by, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  // Move the real focus after an arrow key, once the right month is on screen
  useEffect(() => {
    if (!byKeyboard.current) return;
    byKeyboard.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus, view]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => shiftDate(focus, -1),
      ArrowRight: () => shiftDate(focus, 1),
      ArrowUp: () => shiftDate(focus, -7),
      ArrowDown: () => shiftDate(focus, 7),
      PageUp: () => {
        const d = parseLocalDate(focus);
        d.setMonth(d.getMonth() - 1);
        return shiftDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, Math.min(parseLocalDate(focus).getDate(), 28) - 1);
      },
      PageDown: () => {
        const d = parseLocalDate(focus);
        d.setMonth(d.getMonth() + 1);
        return shiftDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, Math.min(parseLocalDate(focus).getDate(), 28) - 1);
      },
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const next = move();
    byKeyboard.current = true;
    setFocus(next);
    showMonthOf(next);
  };

  const quick = [
    { label: t.today, date: today },
    { label: t.dpTomorrow, date: shiftDate(today, 1) },
    { label: t.dpIn3Days, date: shiftDate(today, 3) },
    { label: t.dpNextWeek, date: shiftDate(today, 7) },
  ];

  return (
    <div className="w-full p-3 sm:w-[19rem]">
      {/* The header changes with the view: month and year, a year, or a range of years */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (mode === 'days' ? stepMonth(-1) : mode === 'months' ? setView(v => ({ ...v, y: v.y - 1 })) : setYearsFrom(y => y - 12))}
          aria-label={mode === 'days' ? t.dpPrevMonth : mode === 'months' ? t.dpPrevYear : t.dpPrevYears}
          className={navButton}
        >
          <Icons.chevronLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (mode === 'days') setMode('months');
            else if (mode === 'months') {
              setYearsFrom(view.y - 5);
              setMode('years');
            } else setMode('days');
          }}
          aria-live="polite"
          title={mode === 'days' ? t.dpPickMonth : mode === 'months' ? t.dpPickYear : undefined}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold text-black transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand"
        >
          {mode === 'days' && formatMonthYear(view.y, view.m, language)}
          {mode === 'months' && formatYear(view.y, language)}
          {mode === 'years' && `${formatYear(yearsFrom, language)} - ${formatYear(yearsFrom + 11, language)}`}
          <Icons.expand className={`size-3.5 text-neutral-400 transition-transform ${mode === 'days' ? '' : 'rotate-180'}`} />
        </button>

        <button
          type="button"
          onClick={() => (mode === 'days' ? stepMonth(1) : mode === 'months' ? setView(v => ({ ...v, y: v.y + 1 })) : setYearsFrom(y => y + 12))}
          aria-label={mode === 'days' ? t.dpNextMonth : mode === 'months' ? t.dpNextYear : t.dpNextYears}
          className={navButton}
        >
          <Icons.chevronRight className="size-4" />
        </button>
      </div>

      {/* One fixed height for all three views, so the panel does not jump when switching */}
      <div className="min-h-[17.25rem] sm:min-h-[15.75rem]">
        {mode === 'days' && (
          <>
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-neutral-400">
              {names.map(name => (
                <span key={name} className="py-1">
                  {name}
                </span>
              ))}
            </div>

            <div ref={gridRef} role="grid" onKeyDown={onKeyDown} className="grid grid-cols-7 gap-y-0.5">
              {days.map(day => {
                const inMonth = parseLocalDate(day).getMonth() === view.m;
                const selected = day === value;
                const isToday = day === today;
                return (
                  <button
                    key={day}
                    type="button"
                    data-date={day}
                    disabled={disabled(day)}
                    tabIndex={day === focus ? 0 : -1}
                    aria-label={day}
                    aria-pressed={selected}
                    onClick={() => onSelect(day)}
                    onFocus={() => setFocus(day)}
                    className={`mx-auto flex size-10 cursor-pointer items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-default disabled:opacity-30 sm:size-9 ${
                      selected
                        ? 'bg-brand font-bold text-white shadow-xs'
                        : isToday
                          ? 'font-bold text-brand ring-1 ring-brand/50 hover:bg-brand-soft'
                          : inMonth
                            ? 'text-black hover:bg-neutral-100'
                            : 'text-neutral-400 hover:bg-neutral-100'
                    }`}
                  >
                    {parseLocalDate(day).getDate()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === 'months' && (
          <div className="grid h-[16.5rem] grid-cols-3 gap-2 pt-1 sm:h-[15rem]">
            {months.map((name, m) => {
              const first = `${view.y}-${String(m + 1).padStart(2, '0')}-01`;
              const last = shiftDate(`${view.y + (m === 11 ? 1 : 0)}-${String(((m + 1) % 12) + 1).padStart(2, '0')}-01`, -1);
              const out = (!!min && last < min) || (!!max && first > max);
              const current = view.y === parseLocalDate(start).getFullYear() && m === parseLocalDate(start).getMonth();
              return (
                <button
                  key={name}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    setView(v => ({ ...v, m }));
                    setFocus(first);
                    setMode('days');
                  }}
                  className={`cursor-pointer rounded-xl text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-30 ${
                    current ? 'bg-brand text-white shadow-xs' : 'bg-neutral-50 text-black hover:bg-neutral-100'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'years' && (
          <div className="grid h-[16.5rem] grid-cols-3 gap-2 pt-1 sm:h-[15rem]">
            {Array.from({ length: 12 }, (_, i) => yearsFrom + i).map(y => {
              const out = (!!min && `${y}-12-31` < min) || (!!max && `${y}-01-01` > max);
              const current = y === parseLocalDate(start).getFullYear();
              const thisYear = y === parseLocalDate(today).getFullYear();
              return (
                <button
                  key={y}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    setView(v => ({ ...v, y }));
                    setMode('months');
                  }}
                  className={`cursor-pointer rounded-xl text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-30 ${
                    current ? 'bg-brand text-white shadow-xs' : thisYear ? 'bg-neutral-50 text-brand ring-1 ring-brand/40' : 'bg-neutral-50 text-black hover:bg-neutral-100'
                  }`}
                >
                  {formatYear(y, language)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3">
        {quick.map(item => (
          <button
            key={item.date}
            type="button"
            disabled={disabled(item.date)}
            onClick={() => onSelect(item.date)}
            className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default disabled:opacity-40 ${
              value === item.date ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        {onClear && value && (
          <button type="button" onClick={onClear} className="ml-auto cursor-pointer px-1.5 py-1.5 text-xs font-semibold text-neutral-500 hover:text-black">
            {t.dpClear}
          </button>
        )}
      </div>
    </div>
  );
};
