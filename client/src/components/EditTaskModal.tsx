import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useEscape } from '../lib/useEscape';
import type { Task, TaskPriority } from '../types';
import { Icons } from './icons';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const field = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-black focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40';

/** A leader changes what a task says. A team task changes for everyone who has it. */
export const EditTaskModal: React.FC<{ task: Task | null; teamSize?: number; onClose: () => void }> = ({ task, teamSize = 1, onClose }) => {
  const { t, editTask } = useApp();
  const [title, setTitle] = useState('');
  const [module, setModule] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setModule(task.module);
    setDescription(task.description);
    setPriority(task.priority);
  }, [task]);

  useEscape(!!task, onClose);
  if (!task) return null;

  const labels: Record<TaskPriority, string> = { low: t.taskPriorityLow, medium: t.taskPriorityMedium, high: t.taskPriorityHigh, urgent: t.taskPriorityUrgent };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !module.trim() || saving) return;
    setSaving(true);
    try {
      await editTask(task.id, { title: title.trim(), module: module.trim(), description: description.trim(), priority });
      onClose();
    } catch {
      // The app shows the error; the form stays open
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={t.editTask} className="modal-panel max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <Icons.edit className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.editTask}</h2>
              <p className="text-xs text-neutral-500">{t.editTaskHint}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t.cancel} className="cursor-pointer rounded-lg p-1 text-neutral-400 hover:text-black">
            <Icons.close className="size-5" />
          </button>
        </div>

        {teamSize > 1 && (
          <p className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-black">
            <Icons.members className="size-3.5 shrink-0" />
            {t.teamTask} · {t.teamTaskPeople.replace('{n}', String(teamSize))}
          </p>
        )}

        <div>
          <label className="mb-1 block text-xs font-bold text-black">{t.taskTitle} *</label>
          <input required value={title} onChange={e => setTitle(e.target.value)} maxLength={200} className={field} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-black">{t.taskModule} *</label>
          <input required value={module} onChange={e => setModule(e.target.value)} maxLength={120} className={field} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-black">{t.taskDescription}</label>
          <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} className={`${field} resize-y`} />
        </div>

        <div>
          <span className="mb-1 block text-xs font-bold text-black">{t.taskPriority}</span>
          <div role="group" className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-0.5">
            {PRIORITIES.map(value => (
              <button
                key={value}
                type="button"
                aria-pressed={priority === value}
                onClick={() => setPriority(value)}
                className={`cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors ${priority === value ? 'bg-white text-black shadow-xs' : 'text-neutral-600 hover:text-black'}`}
              >
                {labels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100">
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !module.trim()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
          >
            {saving && <Icons.loading className="size-3.5 animate-spin" />}
            {t.save}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};
