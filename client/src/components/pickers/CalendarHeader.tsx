import React from 'react';
import { Icons } from '../icons';

interface CalendarHeaderProps {
  title: string;
  titleHint?: string;
  prevLabel: string;
  nextLabel: string;
  open: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTitle: () => void;
}

const navButton =
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black focus-visible:outline-2 focus-visible:outline-brand';

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ title, titleHint, prevLabel, nextLabel, open, onPrev, onNext, onTitle }) => (
  <div className="mb-2 flex items-center justify-between">
    <button type="button" onClick={onPrev} aria-label={prevLabel} className={navButton}>
      <Icons.chevronLeft className="size-4" />
    </button>
    <button
      type="button"
      onClick={onTitle}
      title={titleHint}
      aria-live="polite"
      className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold text-black transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand"
    >
      {title}
      <Icons.expand className={`size-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    <button type="button" onClick={onNext} aria-label={nextLabel} className={navButton}>
      <Icons.chevronRight className="size-4" />
    </button>
  </div>
);
