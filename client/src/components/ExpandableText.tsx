import React, { useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

interface ExpandableTextProps {
  text: string;
  className?: string;
  /** Lines shown before "Show more" appears */
  lines?: 2 | 3 | 4 | 5;
}

const CLAMP = { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4', 5: 'line-clamp-5' } as const;

/** Keeps line breaks. Long text is cut short with a "Show more" button, so nothing is hidden for good. */
export const ExpandableText: React.FC<ExpandableTextProps> = ({ text, className = '', lines = 3 }) => {
  const { t } = useApp();
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);

  return (
    <div>
      <p ref={ref} className={`whitespace-pre-line break-words ${open ? '' : CLAMP[lines]} ${className}`}>
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="mt-1 cursor-pointer text-[11px] font-semibold text-brand-ink hover:underline"
        >
          {open ? t.showLess : t.showMore}
        </button>
      )}
    </div>
  );
};
