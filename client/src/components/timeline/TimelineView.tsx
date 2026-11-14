import React, { useState } from 'react';
import type { Task } from '@shared/types';
import { useApp } from '../../context/AppContext';
import { ExportMenu } from './ExportMenu';
import { GanttChart, STATUS_STYLE, type Zoom } from './GanttChart';
import { Segmented } from './Segmented';
import { TaskDetailPanel } from './TaskDetailPanel';
import { Icons } from '../icons';

const LEGEND: Task['status'][] = ['todo', 'in_progress', 'ready_for_review', 'approved'];

export const TimelineView: React.FC<{ onOpenAssignTask: () => void }> = ({ onOpenAssignTask }) => {
  const { t, users, activeGroup, activeGroupTasks, activeGroupMembers, isTeamLead, rescheduleTask } = useApp();
  const [groupBy, setGroupBy] = useState<'task' | 'member'>('task');
  const [zoom, setZoom] = useState<Zoom>('day');
  const [hideDone, setHideDone] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);

  const tasks = hideDone ? activeGroupTasks.filter(task => task.status !== 'approved') : activeGroupTasks;
  const selected = tasks.find(task => task.id === selectedId);
  const canEdit = (task: Task) => isTeamLead && task.status !== 'approved';
  const reschedule = (task: Task, startDate: string, dueDate: string) => rescheduleTask(task.id, startDate, dueDate);

  const statusLabel: Record<Task['status'], string> = {
    todo: t.taskStatusTodo,
    in_progress: t.taskStatusInProgress,
    ready_for_review: t.taskStatusReview,
    approved: t.taskStatusApproved,
  };

  if (activeGroupTasks.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
        <Icons.timeline className="mx-auto mb-2 size-10 text-neutral-300" />
        <p className="text-sm font-medium">{t.ganttEmpty}</p>
        {isTeamLead && (
          <button
            onClick={onOpenAssignTask}
            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <Icons.add className="size-3.5" />
            {t.assignNewTask}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
        <Segmented
          label={t.ganttGroupLabel}
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { value: 'task', label: t.ganttGroupTask },
            { value: 'member', label: t.ganttGroupMember },
          ]}
        />
        <Segmented
          label={t.ganttZoomLabel}
          value={zoom}
          onChange={setZoom}
          options={[
            { value: 'day', label: t.ganttZoomDay },
            { value: 'week', label: t.ganttZoomWeek },
            { value: 'month', label: t.ganttZoomMonth },
          ]}
        />
        <button
          onClick={() => setFocusToken(n => n + 1)}
          aria-label={t.ganttToday}
          title={t.ganttToday}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-neutral-100"
        >
          <Icons.today className="size-3.5" />
          {t.ganttToday}
        </button>
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-700">
          <input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
          {t.ganttHideDone}
        </label>
        <ExportMenu groupName={activeGroup?.name ?? ''} tasks={tasks} users={users} teamDeadline={activeGroup?.deadline} />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">{t.ganttAllHidden}</div>
      ) : (
        <GanttChart
          tasks={tasks}
          members={activeGroupMembers}
          groupBy={groupBy}
          zoom={zoom}
          teamDeadline={activeGroup?.deadline}
          selectedId={selectedId}
          canEdit={canEdit}
          onSelect={id => setSelectedId(current => (current === id ? null : id))}
          onReschedule={reschedule}
          focusToken={focusToken}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-neutral-600">
        {LEGEND.map(status => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={`size-3 rounded-sm ${STATUS_STYLE[status]}`} />
            {statusLabel[status]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm outline outline-2 outline-brand" />
          {t.ganttOverdue}
        </span>
        <span className="hidden text-neutral-500 sm:inline">{isTeamLead ? t.ganttHintEdit : t.ganttHintView}</span>
      </div>

      {selected && (
        <TaskDetailPanel
          task={selected}
          assignee={users.find(u => u.id === selected.assignedTo)}
          canEdit={canEdit(selected)}
          onReschedule={reschedule}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
};
