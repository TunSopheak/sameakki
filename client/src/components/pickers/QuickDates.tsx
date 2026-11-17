import React from 'react';
import { useApp } from '../../context/AppContext';
import { shiftDate, todayLocal } from '../../lib/dates';

interface QuickDatesProps {
  value: string;
  isDisabled: (date: string) => boolean;
  onSelect: (date: string) => void;
  onClear?: () => void;
}

export const QuickDates: React.FC<QuickDatesProps> = ({ value, isDisabled, onSelect, onClear }) => {
  const { t } = useApp();
  const today = todayLocal();
  const options = [
    { label: t.today, date: today },
    { label: t.dpTomorrow, date: shiftDate(today, 1) },
    { label: t.dpIn3Days, date: shiftDate(today, 3) },
    { label: t.dpNextWeek, date: shiftDate(today, 7) },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3">
      {options.map(option => (
        <button
          key={option.date}
          type="button"
          disabled={isDisabled(option.date)}
          onClick={() => onSelect(option.date)}
          className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default disabled:opacity-40 ${
            value === option.date ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          {option.label}
        </button>
      ))}
      {onClear && value && (
        <button type="button" onClick={onClear} className="ml-auto cursor-pointer px-1.5 py-1.5 text-xs font-semibold text-neutral-500 hover:text-black">
          {t.dpClear}
        </button>
      )}
    </div>
  );
};
