import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

interface TaskProgressProps {
  value: number;
  editable: boolean;
  onCommit: (value: number) => Promise<void> | void;
}

const QUICK = [25, 50, 75, 100];

/** Progress bar, with a slider for people who can update it. */
export const TaskProgress: React.FC<TaskProgressProps> = ({ value, editable, onCommit }) => {
  const { t } = useApp();
  // Value while dragging or saving
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;

  useEffect(() => setDraft(null), [value]);

  const commit = async (next: number) => {
    if (next === value) return setDraft(null);
    setDraft(next);
    try {
      await onCommit(next);
    } finally {
      setDraft(null);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-neutral-600">
        <span>{t.progressLabel}</span>
        <span className="text-sm font-bold text-black font-mono-numbers">{shown}%</span>
      </div>

      {editable ? (
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={shown}
          aria-label={t.progressLabel}
          onChange={e => setDraft(Number(e.target.value))}
          onPointerUp={() => draft !== null && commit(draft)}
          onKeyUp={() => draft !== null && commit(draft)}
          onBlur={() => draft !== null && commit(draft)}
          className="block h-2 w-full cursor-pointer accent-[var(--color-brand)]"
        />
      ) : (
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={shown} className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${shown}%` }} />
        </div>
      )}

      {editable && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {QUICK.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => commit(n)}
              className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                shown === n ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {n === 100 ? t.progressDoneShort : `${n}%`}
            </button>
          ))}
          {shown === 100 && <span className="text-[11px] text-neutral-500">{t.progressHint100}</span>}
        </div>
      )}
    </div>
  );
};
