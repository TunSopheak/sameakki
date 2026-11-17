import { useEscape } from '../lib/useEscape';
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskPriority } from '../types';
import { addDays, todayLocal } from '../lib/dates';
import { Icons } from './icons';
import { AssigneePicker, type AssignMode } from './AssigneePicker';
import { DatePicker } from './pickers/DatePicker';
import { SelectMenu, SELECT_FIELD } from './pickers/SelectMenu';
import { TimePicker } from './pickers/TimePicker';

const pickerField = 'w-full px-3 py-2 text-sm text-black bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ isOpen, onClose }) => {
  const { assignTask, activeGroupMembers: groupMembers, t } = useApp();
  // Viewers cannot work on tasks
  const activeGroupMembers = groupMembers.filter(m => m.role !== 'viewer');
  const groupSize = activeGroupMembers.length;

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('General');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [mode, setMode] = useState<AssignMode>('one');
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

  useEscape(isOpen, onClose);

  const targetCount = mode === 'all' ? groupSize : mode === 'some' ? picked.length : assignedTo ? 1 : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetCount === 0 || submitting) return;

    setSubmitting(true);
    try {
      await assignTask({
        title: title.trim(),
        module: module.trim() || 'General',
        description: description.trim(),
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

          <AssigneePicker
            members={activeGroupMembers}
            mode={mode}
            onModeChange={setMode}
            assignedTo={assignedTo}
            onAssignedTo={setAssignedTo}
            picked={picked}
            onPicked={setPicked}
          />

          <div>
            <label className="block text-xs font-bold text-black mb-1">{t.taskPriority}</label>
            <SelectMenu
              value={priority}
              label={t.taskPriority}
              className={SELECT_FIELD}
              onChange={setPriority}
              options={[
                { value: 'low', label: t.taskPriorityLow, dot: 'bg-neutral-400' },
                { value: 'medium', label: t.taskPriorityMedium, dot: 'bg-sky-500' },
                { value: 'high', label: t.taskPriorityHigh, dot: 'bg-amber-500' },
                { value: 'urgent', label: t.taskPriorityUrgent, dot: 'bg-brand' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">{t.taskStartDate}</label>
              <DatePicker
                required
                value={startDate}
                onChange={value => {
                  setStartDate(value);
                  // Start and due dates never cross
                  if (value > dueDate) setDueDate(value);
                }}
                className={pickerField}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">{t.taskDeadline} *</label>
              <DatePicker
                required
                value={dueDate}
                onChange={value => {
                  setDueDate(value);
                  if (value < startDate) setStartDate(value);
                }}
                className={pickerField}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">{t.taskTime}</label>
              <TimePicker value={dueTime} onChange={setDueTime} className={pickerField} />
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
