import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyPreview } from './daily/DailyPreview';
import { milestoneReached } from '@shared/streak';
import { useStreaks } from '../lib/useStreaks';
import { celebrate } from '../lib/celebrate';
import { Icons } from './icons';

interface DailyStandupBoxProps {
  onOpenGuide?: () => void;
}

export const DailyStandupBox: React.FC<DailyStandupBoxProps> = ({ onOpenGuide }) => {
  const {
    currentUser,
    addSimpleDailyLog,
    canContribute,
    activeGroup,
    showSuccess,
    t,
  } = useApp();
  const { data: streaks, reload } = useStreaks();
  const mine = streaks?.members.find(m => m.userId === currentUser.id);

  const [text, setText] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!canContribute || !activeGroup) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const before = mine?.current ?? 0;
      await addSimpleDailyLog(text.trim());
      // Celebrate a streak that just reached a milestone
      const fresh = await reload();
      const after = fresh?.members.find(m => m.userId === currentUser.id)?.current ?? before;
      const milestone = milestoneReached(before, after);
      if (milestone) {
        showSuccess(t.streakMilestone.replace('{n}', String(milestone)));
        celebrate('milestone');
      }
      setText('');
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3000);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden mb-6">
      <div className="px-5 py-3.5 bg-brand text-white flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-white" />
          <h2 className="text-sm font-bold tracking-tight">
            {t.standupTitle}
          </h2>
          <span className="text-[11px] text-[#ffffffeb] font-normal hidden sm:inline">
            · {t.standupTagline}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {mine && (
            <span
              title={t.streakBest.replace('{n}', String(mine.best))}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-white"
            >
              <Icons.streak className={`size-3.5 ${mine.current > 0 ? 'flame' : ''}`} />
              {mine.current > 0 ? t.streakDays.replace('{n}', String(mine.current)) : t.streakStart}
            </span>
          )}
          <span className="text-[#ffffffeb] text-xs hidden md:inline">
            {t.postedAs} <strong className="text-white">{currentUser.name}</strong>
          </span>
        </div>
      </div>

      <div className="p-5">
        {justSubmitted && (
          <div className="mb-4 p-3 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center gap-2 text-black text-xs">
            <Icons.done className="size-4 text-black shrink-0" />
            <span>
              {t.standupPosted}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              required
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.standupPlaceholder}
              className="w-full px-3.5 py-3 text-sm text-black bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 focus:border-brand transition-colors placeholder:text-neutral-400 leading-relaxed"
            />
          </div>

          {text.trim() && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="mb-2 text-[11px] font-semibold text-neutral-500">{t.dailyPreviewTitle}</p>
              <DailyPreview text={text} />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 text-xs">
            <span className="hidden text-[11px] text-neutral-400 md:inline">
                Ctrl + Enter {t.ctrlEnterHint}
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="disabled:opacity-60 inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Icons.send className="size-3.5" />
                <span>{t.standupSubmit}</span>
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};
