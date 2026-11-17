import React from 'react';
import { useApp } from '../../context/AppContext';
import { DailyPreview } from '../daily/DailyPreview';

/** A ToDo text next to how the app reads it. */
export const GuideExample: React.FC<{ text: string }> = ({ text }) => {
  const { t } = useApp();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <pre className="whitespace-pre-wrap break-words rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm leading-relaxed text-black font-sans">{text}</pre>
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <p className="mb-2 text-[11px] font-semibold text-neutral-500">{t.dailyPreviewTitle}</p>
        <DailyPreview text={text} />
      </div>
    </div>
  );
};
