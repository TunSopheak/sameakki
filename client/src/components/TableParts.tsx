import { SelectMenu, SELECT_FILTER } from './pickers/SelectMenu';
import React from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SortDir } from '../lib/useTableView';

import { Icons } from './icons';

interface SortHeaderProps {
  label: string;
  column: string;
  sort: { key: string; dir: SortDir };
  onSort: (column: string) => void;
  className?: string;
}

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
    <Icons.search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
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
  <SelectMenu value={value} onChange={onChange} options={options} className={SELECT_FILTER} />
);

interface PagerProps {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}

export const Pager: React.FC<PagerProps> = ({ page, pageCount, total, onPage }) => {
  const { t } = useApp();
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-xs text-neutral-500">
      <span>{total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          aria-label={t.pagePrevious}
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
          aria-label={t.pageNext}
          className="rounded-lg p-1.5 hover:bg-neutral-100 disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

interface RowActionProps {
  active: boolean;
  onClick: () => void;
  deleteLabel: string;
  restoreLabel: string;
}

interface IconActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'brand';
}

/** Icon-only action for table rows. */
export const IconAction: React.FC<IconActionProps> = ({ icon: Icon, label, onClick, tone = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-brand-soft hover:text-brand-ink ${
      tone === 'brand' ? 'text-brand-ink' : 'text-neutral-500'
    }`}
  >
    <Icon className="size-4" />
  </button>
);

export const RowAction: React.FC<RowActionProps> = ({ active, onClick, deleteLabel, restoreLabel }) => (
  <IconAction icon={active ? Trash2 : RotateCcw} label={active ? deleteLabel : restoreLabel} onClick={onClick} tone={active ? 'default' : 'brand'} />
);
