import React from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../types';
import { Avatar } from './Avatar';
import { SelectMenu, SELECT_FIELD } from './pickers/SelectMenu';

export type AssignMode = 'one' | 'some' | 'all';

interface AssigneePickerProps {
  members: User[];
  mode: AssignMode;
  onModeChange: (mode: AssignMode) => void;
  assignedTo: string;
  onAssignedTo: (id: string) => void;
  picked: string[];
  onPicked: (ids: string[]) => void;
}

export const AssigneePicker: React.FC<AssigneePickerProps> = ({ members, mode, onModeChange, assignedTo, onAssignedTo, picked, onPicked }) => {
  const { t } = useApp();
  const modeLabel: Record<AssignMode, string> = { one: t.assignOne, some: t.assignSome, all: t.assignEveryone };
  const allPicked = picked.length === members.length;

  const toggle = (id: string) => onPicked(picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-black">{t.taskAssignTo} *</label>
        {members.length > 1 && (
          <div role="tablist" className="flex rounded-lg bg-neutral-100 p-0.5 text-[11px] font-semibold">
            {(['one', 'some', 'all'] as const).map(m => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => onModeChange(m)}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${mode === m ? 'bg-brand text-white shadow-xs' : 'text-neutral-600 hover:text-black'}`}
              >
                {modeLabel[m]}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === 'one' && (
        <SelectMenu
          value={assignedTo}
          label={t.taskAssignTo}
          className={SELECT_FIELD}
          onChange={onAssignedTo}
          options={members.map(m => ({
            value: m.id,
            label: m.name,
            description: m.specialty || undefined,
            avatar: <Avatar name={m.name} avatar={m.avatar} className="size-6" />,
          }))}
        />
      )}

      {mode === 'some' && (
        <div className="rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5 text-[11px] text-neutral-500">
            <span>{t.assignPickHint}</span>
            <button type="button" onClick={() => onPicked(allPicked ? [] : members.map(m => m.id))} className="cursor-pointer font-semibold text-brand-ink hover:underline">
              {allPicked ? t.assignClearAll : t.assignSelectAll}
            </button>
          </div>
          <ul className="max-h-44 divide-y divide-neutral-100 overflow-y-auto">
            {members.map(m => (
              <li key={m.id}>
                <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-black hover:bg-neutral-50">
                  <input type="checkbox" checked={picked.includes(m.id)} onChange={() => toggle(m.id)} className="size-4 accent-[var(--color-brand)]" />
                  <span className="truncate">{m.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === 'all' && (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {t.assignEveryone} ({members.length}) · {t.assignAllHint}
        </p>
      )}
    </div>
  );
};
