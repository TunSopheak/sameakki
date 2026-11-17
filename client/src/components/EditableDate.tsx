import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icons } from './icons';
import { Calendar } from './pickers/Calendar';
import { FloatingPanel } from './pickers/FloatingPanel';

interface EditableDateProps {
  value: string;
  canEdit: boolean;
  onSave: (date: string) => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

/** Date that opens a calendar on click. */
export const EditableDate: React.FC<EditableDateProps> = ({ value, canEdit, onSave, children, className = '' }) => {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  if (!canEdit) return <div className={className}>{children}</div>;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t.editDate}
        className={`group/edit inline-flex cursor-pointer items-center gap-1 text-left ${className}`}
      >
        {children}
        <Icons.edit className="size-3 shrink-0 text-neutral-400 transition-colors group-hover/edit:text-brand-ink" />
      </button>
      <FloatingPanel open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} label={t.editDate}>
        <Calendar
          value={value}
          onSelect={date => {
            setOpen(false);
            if (date !== value) onSave(date);
          }}
        />
      </FloatingPanel>
    </>
  );
};
