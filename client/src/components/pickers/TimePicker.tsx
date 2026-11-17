import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../icons';
import { FloatingPanel } from './FloatingPanel';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const QUICK = ['08:00', '09:00', '12:00', '17:00', '18:00', '23:59'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const pad = (n: number) => String(n).padStart(2, '0');

const Column: React.FC<{ label: string; items: string[]; selected: string; onPick: (item: string) => void }> = ({ label, items, selected, onPick }) => {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (box.current && el) box.current.scrollTop = el.offsetTop - box.current.clientHeight / 2 + el.clientHeight / 2;
  }, []);

  return (
    <div className="flex-1">
      <p className="mb-1 text-center text-[11px] font-semibold text-neutral-400">{label}</p>
      <div ref={box} role="listbox" aria-label={label} className="relative h-44 overflow-y-auto rounded-lg border border-neutral-200 p-1">
        {items.map(item => (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={item === selected}
            onClick={() => onPick(item)}
            className={`block w-full cursor-pointer rounded-md py-1.5 text-center text-sm font-mono-numbers transition-colors ${
              item === selected ? 'bg-brand font-bold text-white' : 'text-black hover:bg-neutral-100'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

/** Time field with quick times and hour/minute lists. */
export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, disabled, className = '' }) => {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const [hour, minute] = (value || '09:00').split(':');
  // Five-minute steps, plus the current minute
  const minutes = Array.from({ length: 12 }, (_, i) => pad(i * 5));
  if (!minutes.includes(minute)) minutes.push(minute), minutes.sort();

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
        <span className={`font-mono-numbers ${value ? '' : 'text-neutral-400'}`}>{value || t.dpSelectTime}</span>
        <Icons.time className="size-4 shrink-0 text-neutral-400" />
      </button>

      <FloatingPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} label={t.dpSelectTime}>
        <div className="w-full p-3 sm:w-64">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK.map(time => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  onChange(time);
                  setOpen(false);
                }}
                className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold font-mono-numbers transition-colors ${
                  value === time ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Column label={t.dpHour} items={HOURS} selected={hour} onPick={h => onChange(`${h}:${minute}`)} />
            <Column label={t.dpMinute} items={minutes} selected={minute} onPick={m => onChange(`${hour}:${m}`)} />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full cursor-pointer rounded-lg bg-brand py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {t.dpDone}
          </button>
        </div>
      </FloatingPanel>
    </div>
  );
};
