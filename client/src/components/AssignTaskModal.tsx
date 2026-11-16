import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskPriority } from '../types';
import { addDays, todayLocal } from '../lib/dates';
import { Icons } from './icons';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'one' | 'some' | 'all';

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ isOpen, onClose }) => {
  const { assignTask, activeGroupMembers: groupMembers, t } = useApp();
  // Viewers cannot work on tasks
  const activeGroupMembers = groupMembers.filter(m => m.role !== 'viewer');
  const groupSize = activeGroupMembers.length;

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('General');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [mode, setMode] = useState<Mode>('one');
  const [picked, setPicked] = useState<string[]>([]);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [startDate, setStartDate] = useState(todayLocal);
  const [dueDate, setDueDate] = useState(() => addDays(5));
  const [dueTime, setDueTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStartDate(todayLocal());
    setDueDate(addDays(5));
    setDueTime('18:00');
    setAssignedTo(activeGroupMembers[0]?.id || '');
    setMode('one');
    setPicked([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const targetCount = mode === 'all' ? groupSize : mode === 'some' ? picked.length : assignedTo ? 1 : 0;
  const togglePicked = (id: string) => setPicked(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetCount === 0 || submitting) return;

    setSubmitting(true);
    try {
      await assignTask({
        title: title.trim(),
        module: module.trim() || 'General',
        description: description.trim() || 'Deliver specified module requirements.',
        ...(mode === 'all' ? { assignToAll: true } : mode === 'some' ? { assigneeIds: picked } : { assignedTo }),
        priority,
        startDate,
        dueDate,
        dueTime,
      });
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-label={t.assignNewTask} className="modal-panel bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-brand text-white flex items-center justify-center">
              <Icons.add className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.assignNewTask}</h2>
              <p className="hidden text-xs text-neutral-500 sm:block">
                {t.assignTaskHint}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg"
          >
            <Icons.close className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.taskTitlePlaceholder}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskModule} *
            </label>
            <input
              type="text"
              required
              value={module}
              onChange={e => setModule(e.target.value)}
              placeholder={t.placeholderModuleExample}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-black">{t.taskAssignTo} *</label>
              {groupSize > 1 && (
                <div role="tablist" className="flex rounded-lg bg-neutral-100 p-0.5 text-[11px] font-semibold">
                  {(['one', 'some', 'all'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => setMode(m)}
                      className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${
                        mode === m ? 'bg-brand text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      {m === 'one' ? t.assignOne : m === 'some' ? t.assignSome : t.assignEveryone}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {mode === 'one' && (
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              >
                {activeGroupMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {mode === 'some' && (
              <div className="rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5 text-[11px] text-neutral-500">
                  <span>{t.assignPickHint}</span>
                  <button
                    type="button"
                    onClick={() => setPicked(picked.length === groupSize ? [] : activeGroupMembers.map(m => m.id))}
                    className="cursor-pointer font-semibold text-brand hover:underline"
                  >
                    {picked.length === groupSize ? t.assignClearAll : t.assignSelectAll}
                  </button>
                </div>
                <ul className="max-h-44 divide-y divide-neutral-100 overflow-y-auto">
                  {activeGroupMembers.map(m => (
                    <li key={m.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-black hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          checked={picked.includes(m.id)}
                          onChange={() => togglePicked(m.id)}
                          className="size-4 accent-[var(--color-brand)]"
                        />
                        <span className="truncate">{m.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {mode === 'all' && (
              <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                {t.assignEveryone} ({groupSize}) · {t.assignAllHint}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">{t.taskPriority}</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            >
              <option value="low">{t.taskPriorityLow}</option>
              <option value="medium">{t.taskPriorityMedium}</option>
              <option value="high">{t.taskPriorityHigh}</option>
              <option value="urgent">{t.taskPriorityUrgent}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">{t.taskStartDate}</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  // Start and due dates never cross
                  if (e.target.value > dueDate) setDueDate(e.target.value);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">{t.taskDeadline} *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => {
                  setDueDate(e.target.value);
                  if (e.target.value < startDate) setStartDate(e.target.value);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">{t.taskTime}</label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskDescription}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t.placeholderDetails}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || targetCount === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-dark disabled:opacity-60 rounded-lg shadow-xs"
            >
              {targetCount > 1 ? t.assignToCount.replace('{n}', String(targetCount)) : t.btnAssign}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
