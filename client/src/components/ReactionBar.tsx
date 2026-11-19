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

interface Burst {
  id: number;
  emoji: string;
  dx: number;
  dy: number;
  rot: number;
}

const BURST_COUNT = 7;

export const ReactionBar: React.FC<ReactionBarProps> = ({ reactions, canReact, onToggle }) => {
  const { t, currentUser, users } = useApp();
  const [open, setOpen] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const addRef = useRef<HTMLButtonElement>(null);
  const counter = useRef(0);

  const reactedBy = (ids: string[]) => {
    const names = ids.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
    return names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', ');
  };

  // The emoji flies up from the bar when you add it
  const burst = (emoji: string) => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const batch: Burst[] = Array.from({ length: BURST_COUNT }, () => ({
      id: counter.current++,
      emoji,
      dx: (Math.random() - 0.5) * 120,
      dy: -40 - Math.random() * 70,
      rot: (Math.random() - 0.5) * 80,
    }));
    setBursts(list => [...list, ...batch]);
    window.setTimeout(() => setBursts(list => list.filter(b => !batch.includes(b))), 1000);
  };

  const toggle = (emoji: string) => {
    const mine = reactions.some(r => r.emoji === emoji && r.userIds.includes(currentUser.id));
    if (!mine) burst(emoji);
    onToggle(emoji);
  };

  const pick = (emoji: string) => {
    setOpen(false);
    toggle(emoji);
  };

  if (reactions.length === 0 && !canReact) return null;

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {bursts.map(b => (
        <span key={b.id} aria-hidden="true" className="emoji-burst left-3 top-0" style={{ ['--dx' as string]: `${b.dx}px`, ['--dy' as string]: `${b.dy}px`, ['--rot' as string]: `${b.rot}deg` }}>
          {b.emoji}
        </span>
      ))}

      {reactions.map(r => {
        const mine = r.userIds.includes(currentUser.id);
        return (
          <button
            key={r.emoji}
            type="button"
            disabled={!canReact}
            aria-pressed={mine}
            title={reactedBy(r.userIds)}
            onClick={() => toggle(r.emoji)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-all enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:active:scale-90 ${
              mine ? 'border-brand/40 bg-brand-soft text-brand-ink shadow-xs' : 'border-transparent bg-neutral-100 text-neutral-700 enabled:hover:bg-neutral-200'
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
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-500 transition-all hover:rotate-12 hover:border-brand hover:text-brand-ink"
          >
            <Icons.reactionAdd className="size-3.5" />
          </button>

          <FloatingPanel open={open} onClose={() => setOpen(false)} anchorRef={addRef} label={t.reactionAdd}>
            <div className="flex flex-wrap justify-center gap-1 p-2">
              {REACTION_EMOJIS.map((emoji, i) => {
                const mine = reactions.some(r => r.emoji === emoji && r.userIds.includes(currentUser.id));
                return (
                  <button
                    key={emoji}
                    type="button"
                    aria-pressed={mine}
                    onClick={() => pick(emoji)}
                    style={{ ['--i' as string]: i }}
                    className={`emoji-in flex size-11 cursor-pointer items-center justify-center rounded-xl text-2xl transition-transform hover:-translate-y-1 hover:scale-125 active:scale-90 ${
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
