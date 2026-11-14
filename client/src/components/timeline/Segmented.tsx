import type { LucideIcon } from 'lucide-react';

interface SegmentedProps<T extends string> {
  options: { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
  /** Read out by screen readers, since the buttons alone do not say what is being chosen. */
  label: string;
}

/** A small "pick one" switch, such as List / Timeline. */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
      {options.map(({ value: v, label: text, icon: Icon }) => {
        const selected = v === value;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(v)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              selected ? 'bg-white text-black shadow-xs' : 'text-neutral-600 hover:text-black'
            }`}
          >
            {Icon && <Icon className="size-3.5" />}
            {text}
          </button>
        );
      })}
    </div>
  );
}
