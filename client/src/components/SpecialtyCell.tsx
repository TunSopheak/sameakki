import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SPECIALTY_SUGGESTIONS } from '../lib/specialties';
import { Icons } from './icons';

interface SpecialtyCellProps {
  value?: string;
  canEdit: boolean;
  onSave: (value: string) => void;
}

/** A member's specialty in this group. Leads (and the member themself) click it to change it. */
export const SpecialtyCell: React.FC<SpecialtyCellProps> = ({ value, canEdit, onSave }) => {
  const { t } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const shown = value || 'General';
  if (!canEdit) return <span>{shown}</span>;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? '');
          setEditing(true);
        }}
        title={t.specialtyEdit}
        className="group/edit inline-flex max-w-full cursor-pointer items-center gap-1 text-left"
      >
        <span className="truncate">{shown}</span>
        <Icons.edit className="size-3 shrink-0 text-neutral-400 transition-colors group-hover/edit:text-brand" />
      </button>
    );
  }

  const finish = (save: boolean) => {
    setEditing(false);
    if (save && draft.trim() !== (value ?? '')) onSave(draft.trim());
  };

  return (
    <input
      autoFocus
      list="specialty-suggestions"
      value={draft}
      placeholder={t.specialtyPlaceholder}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={e => {
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
      className="w-40 rounded-lg border border-brand bg-white px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-brand/40"
    />
  );
};

/** Put once on a page that uses SpecialtyCell, so typing offers common roles. */
export const SpecialtySuggestions: React.FC = () => (
  <datalist id="specialty-suggestions">
    {SPECIALTY_SUGGESTIONS.map(item => (
      <option key={item} value={item} />
    ))}
  </datalist>
);
