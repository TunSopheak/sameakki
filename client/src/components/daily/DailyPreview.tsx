import React from 'react';
import { parseRawLogContent } from '@shared/dailyLogParser';
import { useApp } from '../../context/AppContext';
import { dailyLogPercent } from '../../lib/stats';
import { Icons } from '../icons';

/** Shows how a ToDo text will be read: project name, tasks, ticks and percent. */
export const DailyPreview: React.FC<{ text: string }> = ({ text }) => {
  const { t } = useApp();

  if (!text.trim()) return <p className="text-xs text-neutral-500">{t.dailyPreviewEmpty}</p>;

  const { title, items } = parseRawLogContent(text);
  const percent = dailyLogPercent(items);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-bold text-black">
          <span className="mr-1.5 text-[11px] font-semibold text-neutral-500">{t.dailyPreviewProject}</span>
          {title}
        </p>
        {percent !== null && <span className="shrink-0 text-xs font-bold text-black font-mono-numbers">{percent}%</span>}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-neutral-500">{t.dailyPreviewNoTasks}</p>
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              {item.done ? <Icons.daily className="mt-0.5 size-4 shrink-0 text-brand-ink" /> : <Icons.todoOpen className="mt-0.5 size-4 shrink-0 text-neutral-500" />}
              <span className={`min-w-0 flex-1 break-words ${item.done ? 'text-neutral-500 line-through' : 'text-black'}`}>{item.text}</span>
              {item.progressTag && <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-bold text-black font-mono-numbers">{item.progressTag}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
