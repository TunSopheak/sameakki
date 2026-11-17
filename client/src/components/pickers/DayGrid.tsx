import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { monthGrid, parseLocalDate, shiftDate, shiftMonth, todayLocal, weekdayNames } from '../../lib/dates';

interface DayGridProps {
  year: number;
  month: number;
  value: string;
  focus: string;
  isDisabled: (date: string) => boolean;
  onSelect: (date: string) => void;
  onFocusChange: (date: string) => void;
}

const dayClass = (selected: boolean, isToday: boolean, inMonth: boolean) => {
  if (selected) return 'bg-brand font-bold text-white shadow-xs';
  if (isToday) return 'font-bold text-brand-ink ring-1 ring-brand/50 hover:bg-brand-soft';
  return inMonth ? 'text-black hover:bg-neutral-100' : 'text-neutral-400 hover:bg-neutral-100';
};

export const DayGrid: React.FC<DayGridProps> = ({ year, month, value, focus, isDisabled, onSelect, onFocusChange }) => {
  const { language } = useApp();
  const today = todayLocal();
  const gridRef = useRef<HTMLDivElement>(null);
  const movedByKey = useRef(false);

  // After an arrow key, move the real focus once the right month is shown
  useEffect(() => {
    if (!movedByKey.current) return;
    movedByKey.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus, year, month]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, string> = {
      ArrowLeft: shiftDate(focus, -1),
      ArrowRight: shiftDate(focus, 1),
      ArrowUp: shiftDate(focus, -7),
      ArrowDown: shiftDate(focus, 7),
      PageUp: shiftMonth(focus, -1),
      PageDown: shiftMonth(focus, 1),
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    movedByKey.current = true;
    onFocusChange(moves[e.key]);
  };

  return (
    <>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-neutral-400">
        {weekdayNames(language).map(name => (
          <span key={name} className="py-1">
            {name}
          </span>
        ))}
      </div>

      <div ref={gridRef} role="grid" onKeyDown={onKeyDown} className="grid grid-cols-7 gap-y-0.5">
        {monthGrid(year, month).map(day => {
          const date = parseLocalDate(day);
          return (
            <button
              key={day}
              type="button"
              data-date={day}
              disabled={isDisabled(day)}
              tabIndex={day === focus ? 0 : -1}
              aria-label={day}
              aria-pressed={day === value}
              onClick={() => onSelect(day)}
              onFocus={() => onFocusChange(day)}
              className={`mx-auto flex size-10 cursor-pointer items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-default disabled:opacity-30 sm:size-9 ${dayClass(
                day === value,
                day === today,
                date.getMonth() === month
              )}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
};
