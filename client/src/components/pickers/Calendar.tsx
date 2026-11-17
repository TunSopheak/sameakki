import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMonthYear, formatYear, monthBounds, parseLocalDate, todayLocal } from '../../lib/dates';
import { CalendarHeader } from './CalendarHeader';
import { DayGrid } from './DayGrid';
import { MonthGrid } from './MonthGrid';
import { QuickDates } from './QuickDates';
import { YearGrid } from './YearGrid';

interface CalendarProps {
  value: string;
  min?: string;
  max?: string;
  onSelect: (date: string) => void;
  onClear?: () => void;
}

type Mode = 'days' | 'months' | 'years';

export const Calendar: React.FC<CalendarProps> = ({ value, min, max, onSelect, onClear }) => {
  const { t, language } = useApp();
  const today = todayLocal();
  const start = parseLocalDate(value || today);
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });
  const [focus, setFocus] = useState(value || today);
  const [mode, setMode] = useState<Mode>('days');
  const [yearsFrom, setYearsFrom] = useState(view.year - 5);

  const isDisabled = (date: string) => (!!min && date < min) || (!!max && date > max);

  const labels = {
    days: { prev: t.dpPrevMonth, next: t.dpNextMonth, hint: t.dpPickMonth },
    months: { prev: t.dpPrevYear, next: t.dpNextYear, hint: t.dpPickYear },
    years: { prev: t.dpPrevYears, next: t.dpNextYears, hint: undefined },
  }[mode];

  const title = {
    days: formatMonthYear(view.year, view.month, language),
    months: formatYear(view.year, language),
    years: `${formatYear(yearsFrom, language)} - ${formatYear(yearsFrom + 11, language)}`,
  }[mode];

  const step = (by: number) => {
    if (mode === 'days') {
      const d = new Date(view.year, view.month + by, 1);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    } else if (mode === 'months') {
      setView({ ...view, year: view.year + by });
    } else {
      setYearsFrom(yearsFrom + by * 12);
    }
  };

  const goDeeper = () => {
    if (mode === 'days') setMode('months');
    else if (mode === 'months') {
      setYearsFrom(view.year - 5);
      setMode('years');
    } else setMode('days');
  };

  const moveFocus = (date: string) => {
    const d = parseLocalDate(date);
    setFocus(date);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="w-full p-3 sm:w-[19rem]">
      <CalendarHeader
        title={title}
        titleHint={labels.hint}
        prevLabel={labels.prev}
        nextLabel={labels.next}
        open={mode !== 'days'}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onTitle={goDeeper}
      />

      <div className="min-h-[17.25rem] sm:min-h-[15.75rem]">
        {mode === 'days' && (
          <DayGrid year={view.year} month={view.month} value={value} focus={focus} isDisabled={isDisabled} onSelect={onSelect} onFocusChange={moveFocus} />
        )}
        {mode === 'months' && (
          <MonthGrid
            year={view.year}
            selected={{ year: start.getFullYear(), month: start.getMonth() }}
            min={min}
            max={max}
            onPick={month => {
              setView({ ...view, month });
              setFocus(monthBounds(view.year, month).first);
              setMode('days');
            }}
          />
        )}
        {mode === 'years' && (
          <YearGrid
            from={yearsFrom}
            selected={start.getFullYear()}
            thisYear={parseLocalDate(today).getFullYear()}
            min={min}
            max={max}
            onPick={year => {
              setView({ ...view, year });
              setMode('months');
            }}
          />
        )}
      </div>

      <QuickDates value={value} isDisabled={isDisabled} onSelect={onSelect} onClear={onClear} />
    </div>
  );
};
