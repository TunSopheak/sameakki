import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../icons';
import { FloatingPanel } from './FloatingPanel';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  dot?: string;
  avatar?: React.ReactNode;
}

interface SelectMenuProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  display?: React.ReactNode;
  placeholder?: string;
  searchable?: boolean;
}

export const SELECT_PILL =
  'inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800 transition-colors enabled:hover:bg-neutral-200';
export const SELECT_FILTER =
  'inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50';
export const SELECT_COMPACT =
  'inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-black transition-colors hover:bg-neutral-50';
export const SELECT_FIELD =
  'flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-black transition-colors hover:border-neutral-300';

const Marker: React.FC<{ avatar?: React.ReactNode; dot?: string }> = ({ avatar, dot }) =>
  avatar ? <span className="shrink-0">{avatar}</span> : <span className={`size-2 shrink-0 rounded-full ${dot ?? 'bg-neutral-300'}`} aria-hidden />;

interface SelectRowProps {
  label: string;
  description?: string;
  dot?: string;
  avatar?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

const SelectRow: React.FC<SelectRowProps> = ({ label, description, dot, avatar, selected, onClick }) => (
  <button
    type="button"
    role="option"
    aria-selected={selected}
    onClick={onClick}
    className={`flex w-full cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
      selected ? 'bg-brand-soft' : 'hover:bg-neutral-100'
    } ${description ? 'items-start' : 'items-center'}`}
  >
    <span className={description && !avatar ? 'mt-1.5' : ''}>
      <Marker avatar={avatar} dot={dot} />
    </span>
    <span className="min-w-0 flex-1">
      <span className={`block truncate text-sm font-semibold ${selected ? 'text-brand-ink' : 'text-black'}`}>{label}</span>
      {description && <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">{description}</span>}
    </span>
    {selected && <Icons.confirm className="size-4 shrink-0 text-brand-ink" />}
  </button>
);

/** Dropdown that replaces the browser select. A sheet on phones. */
export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  className = SELECT_PILL,
  icon,
  display,
  placeholder,
  searchable,
}: SelectMenuProps<T>) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuWidth, setMenuWidth] = useState(0);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const current = options.find(o => o.value === value);
  const showSearch = searchable ?? options.length > 7;

  const q = query.trim().toLowerCase();
  const shown = q ? options.filter(o => `${o.label} ${o.description ?? ''}`.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (showSearch && window.matchMedia('(pointer: fine)').matches) searchRef.current?.focus();
      else listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, showSearch]);

  const toggle = () => {
    if (!open) {
      setQuery('');
      setMenuWidth(anchorRef.current?.offsetWidth ?? 0);
    }
    setOpen(o => !o);
  };

  const choose = (next: T) => {
    setOpen(false);
    anchorRef.current?.focus();
    if (next !== value) onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => rows[Math.max(0, Math.min(i, rows.length - 1))]?.focus();
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') {
      if (at <= 0 && showSearch) searchRef.current?.focus();
      else go(at - 1);
    } else if (e.key === 'Home' && at >= 0) go(0);
    else if (e.key === 'End' && at >= 0) go(rows.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`${className} cursor-pointer disabled:cursor-default ${open ? 'border-brand ring-1 ring-brand/40' : ''}`}
      >
        {icon}
        {current && display === undefined && (current.avatar || current.dot) && <Marker avatar={current.avatar} dot={current.dot} />}
        <span className={`truncate ${current || display ? '' : 'text-neutral-400'}`}>{display ?? current?.label ?? placeholder ?? ''}</span>
        {!disabled && <Icons.expand className={`ml-auto size-3 shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </button>

      <FloatingPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} label={label ?? ''}>
        <div className="w-full p-1.5 sm:w-auto" style={{ minWidth: Math.max(menuWidth, 224) }} onKeyDown={onKeyDown}>
          {label && <p className="px-3 pb-1 pt-3 text-xs font-bold text-neutral-500 sm:hidden">{label}</p>}

          {showSearch && (
            <div className="relative mb-1 px-1.5 pt-1">
              <Icons.search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.selectSearch}
                aria-label={t.selectSearch}
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm text-black focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
          )}

          <div ref={listRef} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
            {shown.length === 0 && <p className="px-3 py-4 text-center text-xs text-neutral-500">{t.selectNoResults}</p>}
            {shown.map(option => (
              <SelectRow key={option.value} {...option} selected={option.value === value} onClick={() => choose(option.value)} />
            ))}
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}
