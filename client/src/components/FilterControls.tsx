import React from 'react';

/** The same look for the filters on the Tasks and the Daily ToDo pages. */

/** The frame of a filter bar. */
export const FilterPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">{children}</div>
);

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** Shown after the label. Red when `warn` is set and the number is above zero. */
  count?: number;
  warn?: boolean;
}

/** A few choices side by side, one selected (like "Whose tasks" and "When"). */
export function SegmentGroup<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: Option<T>[] }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap items-center rounded-lg bg-neutral-100 p-0.5 text-xs">
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-colors ${active ? 'bg-white text-black shadow-xs' : 'text-neutral-600 hover:text-black'}`}
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && (
              <span className={`font-mono-numbers text-[11px] ${option.warn && option.count > 0 ? 'font-bold text-brand-ink' : 'text-neutral-500'}`}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The status filter: one button per status with its number. */
export function StatusChips<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: (Option<T> & { count: number })[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              active ? 'bg-brand text-white shadow-xs' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {option.label}
            <span className={`font-mono-numbers text-[11px] ${active ? 'text-white/80' : 'text-neutral-500'}`}>{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}
