import React from 'react';
import { useApp } from '../context/AppContext';
import { averageProgress } from '../lib/stats';
import type { Task } from '../types';
import { Icons } from './icons';

interface TeamTaskBannerProps {
  tasks: Task[];
  onBack: () => void;
}

export const TeamTaskBanner: React.FC<TeamTaskBannerProps> = ({ tasks, onBack }) => {
  const { t } = useApp();
  if (tasks.length === 0) return null;

  const done = tasks.filter(task => task.status === 'ready_for_review' || task.status === 'approved').length;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-2.5 text-xs text-brand-ink">
      <Icons.members className="size-4 shrink-0" />
      <span className="font-semibold">
        {t.teamTaskViewing} · {t.teamTaskPeople.replace('{n}', String(tasks.length))}
      </span>
      <span className="font-bold font-mono-numbers">
        {averageProgress(tasks)}% · {t.teamTaskDone.replace('{done}', String(done)).replace('{total}', String(tasks.length))}
      </span>
      <button type="button" onClick={onBack} className="ml-auto cursor-pointer font-semibold hover:underline">
        {t.teamTaskBack}
      </button>
    </div>
  );
};
