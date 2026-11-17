import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatYear } from '../../lib/dates';

interface YearGridProps {
  from: number;
  selected: number;
  thisYear: number;
  min?: string;
  max?: string;
  onPick: (year: number) => void;
}

export const YearGrid: React.FC<YearGridProps> = ({ from, selected, thisYear, min, max, onPick }) => {
  const { language } = useApp();

  return (
    <div className="grid h-[16.5rem] grid-cols-3 gap-2 pt-1 sm:h-[15rem]">
      {Array.from({ length: 12 }, (_, i) => from + i).map(year => {
        const outOfRange = (!!min && `${year}-12-31` < min) || (!!max && `${year}-01-01` > max);
        const style =
          year === selected
            ? 'bg-brand text-white shadow-xs'
            : year === thisYear
              ? 'bg-neutral-50 text-brand-ink ring-1 ring-brand/40'
              : 'bg-neutral-50 text-black hover:bg-neutral-100';
        return (
          <button
            key={year}
            type="button"
            disabled={outOfRange}
            onClick={() => onPick(year)}
            className={`cursor-pointer rounded-xl text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-30 ${style}`}
          >
            {formatYear(year, language)}
          </button>
        );
      })}
    </div>
  );
};
