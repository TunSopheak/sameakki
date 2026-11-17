import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { DailyLog } from '../../types';
import { Icons } from '../icons';
import { DailyPreview } from './DailyPreview';

interface DailyLogEditorProps {
  log: DailyLog;
  onClose: () => void;
}

export const DailyLogEditor: React.FC<DailyLogEditorProps> = ({ log, onClose }) => {
  const { t, editDailyLog } = useApp();
  const [text, setText] = useState(log.rawContent);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      if (text.trim() !== log.rawContent.trim()) await editDailyLog(log.id, text.trim());
      onClose();
    } catch {
      // the error is already shown
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void save();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="space-y-3 py-3">
      <textarea
        autoFocus
        rows={6}
        value={text}
        maxLength={10000}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        className="block w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-black focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
      />
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="mb-2 text-[11px] font-semibold text-neutral-500">{t.dailyPreviewTitle}</p>
        <DailyPreview text={text} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-neutral-500">{t.dailyEditHint}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !text.trim()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
          >
            {saving ? <Icons.loading className="size-3.5 animate-spin" /> : <Icons.confirm className="size-3.5" />}
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
