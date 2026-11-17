import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateLong } from '../../lib/dates';
import { Icons } from '../icons';
import { Calendar } from './Calendar';
import { FloatingPanel } from './FloatingPanel';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
  className?: string;
}

/** Date field with a calendar popup. */
export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, min, max, required, disabled, clearable, placeholder, className = '' }) => {
  const { t, language } = useApp();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const pick = (date: string) => {
    onChange(date);
    setOpen(false);
    anchorRef.current?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${className} flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-default ${open ? 'border-brand ring-1 ring-brand/40' : ''}`}
      >
        <span className={`truncate ${value ? '' : 'text-neutral-400'}`}>{value ? formatDateLong(value, language) : placeholder ?? t.dpSelectDate}</span>
        <Icons.date className="size-4 shrink-0 text-neutral-400" />
      </button>

      {/* So the browser required message works */}
      {required && <input tabIndex={-1} aria-hidden required value={value} onChange={() => undefined} className="pointer-events-none absolute inset-0 opacity-0" />}

      <FloatingPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} label={t.dpSelectDate}>
        <Calendar value={value} min={min} max={max} onSelect={pick} onClear={clearable ? () => pick('') : undefined} />
      </FloatingPanel>
    </div>
  );
};
