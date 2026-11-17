import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { REACTION_EMOJIS } from '../lib/reactions';
import type { DailyLogReaction } from '../types';
import { Icons } from './icons';
import { FloatingPanel } from './pickers/FloatingPanel';

interface ReactionBarProps {
  reactions: DailyLogReaction[];
  canReact: boolean;
  onToggle: (emoji: string) => void;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ reactions, canReact, onToggle }) => {
  const { t, currentUser, users } = useApp();
  const [open, setOpen] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);

  const reactedBy = (ids: string[]) => {
    const names = ids.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
    return names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', ');
  };

  const pick = (emoji: string) => {
    setOpen(false);
    onToggle(emoji);
  };

  if (reactions.length === 0 && !canReact) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactions.map(r => {
        const mine = r.userIds.includes(currentUser.id);
        return (
          <button
            key={r.emoji}
            type="button"
            disabled={!canReact}
            aria-pressed={mine}
            title={reactedBy(r.userIds)}
            onClick={() => onToggle(r.emoji)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-all enabled:cursor-pointer enabled:active:scale-95 ${
              mine ? 'border-brand/40 bg-brand-soft text-brand-ink' : 'border-transparent bg-neutral-100 text-neutral-700 enabled:hover:bg-neutral-200'
            }`}
          >
            <span className="text-sm leading-none">{r.emoji}</span>
            <span key={r.count} className="react-pop font-mono-numbers">
              {r.count}
            </span>
          </button>
        );
      })}

      {canReact && (
        <>
          <button
            ref={addRef}
            type="button"
            aria-label={t.reactionAdd}
            title={t.reactionAdd}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-500 transition-colors hover:border-brand hover:text-brand-ink"
          >
            <Icons.reactionAdd className="size-3.5" />
          </button>

          <FloatingPanel open={open} onClose={() => setOpen(false)} anchorRef={addRef} label={t.reactionAdd}>
            <div className="flex justify-center gap-1 p-2">
              {REACTION_EMOJIS.map(emoji => {
                const mine = reactions.some(r => r.emoji === emoji && r.userIds.includes(currentUser.id));
                return (
                  <button
                    key={emoji}
                    type="button"
                    aria-pressed={mine}
                    onClick={() => pick(emoji)}
                    className={`flex size-11 cursor-pointer items-center justify-center rounded-xl text-2xl transition-transform hover:scale-110 active:scale-95 ${
                      mine ? 'bg-brand-soft' : 'hover:bg-neutral-100'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </FloatingPanel>
        </>
      )}
    </div>
  );
};
