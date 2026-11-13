import React from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, RotateCcw, Search, Trash2 } from 'lucide-react';
import type { SortDir } from '../../lib/useTableView';

interface SortHeaderProps {
  label: string;
  column: string;
  sort: { key: string; dir: SortDir };
  onSort: (column: string) => void;
  className?: string;
}

/** Clickable column title that shows the sort direction. */
export const SortHeader: React.FC<SortHeaderProps> = ({ label, column, sort, onSort, className = '' }) => {
  const active = sort.key === column;
  return (
    <th className={`px-4 py-2.5 font-semibold ${className}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(column)} className="inline-flex items-center gap-1 hover:text-black">
        {label}
        {active && (sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  );
};

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, placeholder }) => (
  <div className="relative min-w-0 flex-1 sm:max-w-xs">
    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
    />
  </div>
);

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export const FilterSelect: React.FC<FilterSelectProps> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-700 focus:border-brand focus:outline-none"
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

interface PagerProps {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}

export const Pager: React.FC<PagerProps> = ({ page, pageCount, total, onPage }) => (
  <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-500">
    <span>{total}</span>
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
        className="rounded-lg p-1.5 hover:bg-neutral-100 disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-12 text-center font-medium text-neutral-700">
        {page + 1} / {pageCount}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label="Next page"
        className="rounded-lg p-1.5 hover:bg-neutral-100 disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  </div>
);

interface RowActionProps {
  active: boolean;
  onClick: () => void;
  deleteLabel: string;
  restoreLabel: string;
}

export const RowAction: React.FC<RowActionProps> = ({ active, onClick, deleteLabel, restoreLabel }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
      active ? 'text-neutral-500 hover:bg-brand-soft hover:text-brand' : 'text-brand hover:bg-brand-soft'
    }`}
  >
    {active ? <Trash2 className="size-3.5" /> : <RotateCcw className="size-3.5" />}
    {active ? deleteLabel : restoreLabel}
  </button>
);
