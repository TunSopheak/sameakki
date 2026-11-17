import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../icons';
import { FloatingPanel } from './FloatingPanel';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** A short line under the label */
  description?: string;
  /** Tailwind background class for a small coloured dot, e.g. 'bg-emerald-500' */
  dot?: string;
}

interface SelectMenuProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Names the control for screen readers, and titles the sheet on a phone. */
  label: string;
  disabled?: boolean;
  /** Looks of the closed control. A small pill by default. */
  className?: string;
}

const PILL =
  'inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800 transition-colors enabled:hover:bg-neutral-200';

/** A dropdown that replaces the browser's own <select>: a menu beside the control, or a bottom sheet on a phone. */
export function SelectMenu<T extends string>({ value, options, onChange, label, disabled, className = PILL }: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value) ?? options[0];

  // Put the keyboard on the chosen row as soon as the menu opens
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const choose = (next: T) => {
    setOpen(false);
    anchorRef.current?.focus();
    if (next !== value) onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => rows[(i + rows.length) % rows.length]?.focus();
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(rows.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`${className} cursor-pointer disabled:cursor-default`}
      >
        {current.dot && <span className={`size-2 shrink-0 rounded-full ${current.dot}`} aria-hidden />}
        <span className="truncate">{current.label}</span>
        {!disabled && <Icons.expand className={`size-3 shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </button>

      <FloatingPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} label={label}>
        <div className="w-full p-1.5 sm:w-64">
          <p className="px-3 pb-1 pt-3 text-xs font-bold text-neutral-500 sm:hidden">{label}</p>
          <div ref={listRef} role="listbox" aria-label={label} onKeyDown={onKeyDown}>
            {options.map(option => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(option.value)}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                    selected ? 'bg-brand-soft' : 'hover:bg-neutral-100'
                  }`}
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${option.dot ?? 'bg-neutral-300'}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${selected ? 'text-brand' : 'text-black'}`}>{option.label}</span>
                    {option.description && <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">{option.description}</span>}
                  </span>
                  {selected && <Icons.confirm className="mt-0.5 size-4 shrink-0 text-brand" />}
                </button>
              );
            })}
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}
