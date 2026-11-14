import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icons } from './icons';

interface EditableDateProps {
  /** The current date, "YYYY-MM-DD". Empty when there is none. */
  value: string;
  /** Without permission the date is shown and cannot be changed. */
  canEdit: boolean;
  onSave: (date: string) => void;
  /** What to show while not editing. */
  children: React.ReactNode;
  /** Where the chip is placed, e.g. 'justify-end'. */
  className?: string;
  size?: 'sm' | 'md';
}

/** A date that turns into a small date field with save and cancel when a leader clicks it. */
export const EditableDate: React.FC<EditableDateProps> = ({ value, canEdit, onSave, children, className = '', size = 'md' }) => {
  const { t } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing && canEdit) {
    const save = () => {
      if (draft && draft !== value) onSave(draft);
      setEditing(false);
    };
    return (
      <div className={`flex items-center gap-1 rounded-lg border border-brand bg-white p-1 ${className}`}>
        <input
          type="date"
          value={draft}
          autoFocus
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          className={`bg-white text-black focus:outline-none ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}
        />
        <button type="button" onClick={save} aria-label={t.save} title={t.save} className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md bg-brand text-white transition-colors hover:bg-brand-dark">
          <Icons.confirm className="size-3.5" />
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label={t.cancel} title={t.cancel} className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black">
          <Icons.close className="size-3.5" />
        </button>
      </div>
    );
  }

  if (!canEdit) return <div className={className}>{children}</div>;

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title={t.editDate}
      className={`group/edit inline-flex cursor-pointer items-center gap-1 text-left ${className}`}
    >
      {children}
      <Icons.edit className="size-3 shrink-0 text-neutral-400 transition-colors group-hover/edit:text-brand" />
    </button>
  );
};
