import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Task, User } from '@shared/types';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../Avatar';
import { fromDay, spanDays, toDay } from './ganttModel';

const dateField =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-black focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40 disabled:opacity-60';

interface TaskDetailPanelProps {
  task: Task;
  assignee?: User;
  canEdit: boolean;
  onReschedule: (task: Task, startDate: string, dueDate: string) => Promise<void>;
  onClose: () => void;
}

/** What is under the chart when a bar is selected. Leaders can type new dates here, which also works on a phone. */
export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, assignee, canEdit, onReschedule, onClose }) => {
  const { t, language } = useApp();
  const [start, setStart] = useState(task.startDate);
  const [due, setDue] = useState(task.dueDate);
  const [saving, setSaving] = useState(false);

  // Follow the task when it changes, for example after dragging its bar
  useEffect(() => {
    setStart(task.startDate);
    setDue(task.dueDate);
  }, [task.id, task.startDate, task.dueDate]);

  const status = { todo: t.taskStatusTodo, in_progress: t.taskStatusInProgress, ready_for_review: t.taskStatusReview, approved: t.taskStatusApproved }[task.status];
  const priority = { low: t.taskPriorityLow, medium: t.taskPriorityMedium, high: t.taskPriorityHigh, urgent: t.taskPriorityUrgent }[task.priority];
  const changed = start !== task.startDate || due !== task.dueDate;
  const days = start && due && start <= due ? spanDays({ start: toDay(start), end: toDay(due) }) : null;

  // The two dates never cross: moving one past the other takes the other along
  const changeStart = (value: string) => {
    setStart(value);
    if (value && due && value > due) setDue(value);
  };
  const changeDue = (value: string) => {
    setDue(value);
    if (value && start && value < start) setStart(value);
  };

  const save = async () => {
    if (!changed || !start || !due || saving) return;
    setSaving(true);
    try {
      await onReschedule(task, start, due);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="animate-rise rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold">{task.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-700">{status}</span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-700">{priority}</span>
            {task.module && <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-700">{task.module}</span>}
            {assignee && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-700">
                <Avatar name={assignee.name} avatar={assignee.avatar} className="size-5" />
                {language === 'km' && assignee.nameKm ? assignee.nameKm : assignee.name}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} aria-label={t.close} className="shrink-0 cursor-pointer rounded-lg p-1 text-neutral-400 transition-colors hover:text-black">
          <X className="size-5" />
        </button>
      </div>

      {task.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">{task.description}</p>}

      <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-bold">{t.taskStartDate}</span>
          <input type="date" value={start} disabled={!canEdit} onChange={e => changeStart(e.target.value)} className={dateField} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold">{t.taskDeadline}</span>
          <input type="date" value={due} disabled={!canEdit} onChange={e => changeDue(e.target.value)} className={dateField} />
        </label>
        {canEdit ? (
          <button
            onClick={save}
            disabled={!changed || !start || !due || saving}
            className="inline-flex h-[38px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-white transition-all hover:bg-brand-dark disabled:cursor-default disabled:opacity-40"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {t.ganttSaveSchedule}
          </button>
        ) : (
          days && (
            <p className="pb-2 text-xs font-semibold text-neutral-500">
              {days} {t.ganttDaysShort}
            </p>
          )
        )}
      </div>
      {canEdit && days && (
        <p className="mt-2 text-[11px] text-neutral-500">
          {days} {t.ganttDaysShort} · {fromDay(toDay(start))} → {fromDay(toDay(due))}
        </p>
      )}
    </section>
  );
};
