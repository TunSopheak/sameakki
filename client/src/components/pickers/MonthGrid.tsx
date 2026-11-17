import React from 'react';
import { useApp } from '../../context/AppContext';
import { monthBounds, monthShortNames } from '../../lib/dates';

interface MonthGridProps {
  year: number;
  selected: { year: number; month: number };
  min?: string;
  max?: string;
  onPick: (month: number) => void;
}

export const MonthGrid: React.FC<MonthGridProps> = ({ year, selected, min, max, onPick }) => {
  const { language } = useApp();

  return (
    <div className="grid h-[16.5rem] grid-cols-3 gap-2 pt-1 sm:h-[15rem]">
      {monthShortNames(language).map((name, month) => {
        const { first, last } = monthBounds(year, month);
        const outOfRange = (!!min && last < min) || (!!max && first > max);
        const current = year === selected.year && month === selected.month;
        return (
          <button
            key={name}
            type="button"
            disabled={outOfRange}
            onClick={() => onPick(month)}
            className={`cursor-pointer rounded-xl text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-30 ${
              current ? 'bg-brand text-white shadow-xs' : 'bg-neutral-50 text-black hover:bg-neutral-100'
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
};
