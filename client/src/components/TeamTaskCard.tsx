import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Task, TaskStatus, User } from '../types';
import { Avatar } from './Avatar';
import { Icons } from './icons';
import { TaskProgress } from './TaskProgress';

interface TeamTaskCardProps {
  /** Every member's copy of the team task, not only the ones passing the current filters. */
  tasks: Task[];
  users: User[];
  priority: { label: string; className: string };
  deadline: { text: string; overdue: boolean };
  onProgress: (taskId: string, value: number) => Promise<void> | void;
  onOpenIndividual: () => void;
  onDelete: () => void;
}

const STATUS_ORDER: Record<TaskStatus, number> = { todo: 0, in_progress: 1, ready_for_review: 2, approved: 3 };
const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: 'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-neutral-200 text-black',
  ready_for_review: 'bg-brand-soft text-brand',
  approved: 'bg-brand text-white',
};

/** One card for a task given to several people: overall progress on top, each person's part below. */
export const TeamTaskCard: React.FC<TeamTaskCardProps> = ({ tasks, users, priority, deadline, onProgress, onOpenIndividual, onDelete }) => {
  const { t, currentUser, isTeamLead, canContribute } = useApp();
  // The member whose slider is open (leads can open anyone's)
  const [editing, setEditing] = useState<string | null>(null);

  const first = tasks[0];
  const total = tasks.length;
  const percent = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / total);
  const done = tasks.filter(task => task.status === 'ready_for_review' || task.status === 'approved').length;
  const doing = tasks.filter(task => task.status === 'in_progress').length;
  const todo = total - done - doing;

  const statusLabel: Record<TaskStatus, string> = {
    todo: t.taskStatusTodo,
    in_progress: t.taskStatusInProgress,
    ready_for_review: t.taskStatusReview,
    approved: t.taskStatusApproved,
  };

  const nameOf = (id: string) => users.find(u => u.id === id)?.name ?? '';
  // Who still has work to do comes first; the viewer's own part stays at the very top
  const people = [...tasks].sort(
    (a, b) =>
      Number(b.assignedTo === currentUser.id) - Number(a.assignedTo === currentUser.id) ||
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      nameOf(a.assignedTo).localeCompare(nameOf(b.assignedTo))
  );

  return (
    <div className="lift flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
              <Icons.members className="size-3.5" />
              {t.teamTask} · {t.teamTaskPeople.replace('{n}', String(total))}
            </span>
            <span className="truncate rounded-lg bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-black">{first.module}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-lg px-2 py-0.5 text-[11px] uppercase ${priority.className}`}>{priority.label}</span>
            {isTeamLead && (
              <button
                type="button"
                onClick={() => confirm(t.teamTaskDeleteConfirm.replace('{n}', String(total))) && onDelete()}
                title={t.delete}
                className="cursor-pointer p-0.5 text-neutral-400 transition-colors hover:text-black"
              >
                <Icons.remove className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold tracking-tight text-black">{first.title}</h3>
        <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600">{first.description}</p>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold text-neutral-600">{t.teamTaskOverall}</span>
          <span className="text-lg font-bold leading-none text-black font-mono-numbers">{percent}%</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-500">
          {t.teamTaskStats.replace('{done}', String(done)).replace('{doing}', String(doing)).replace('{todo}', String(todo))}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5 text-[11px] font-semibold text-neutral-500">
          <span>{t.teamTaskMembers}</span>
          {isTeamLead && <span className="font-normal">{t.teamTaskEdit}</span>}
        </div>
        <ul className="max-h-72 divide-y divide-neutral-100 overflow-y-auto">
          {people.map(item => {
            const person = users.find(u => u.id === item.assignedTo);
            const mine = item.assignedTo === currentUser.id;
            const canEdit = item.status !== 'approved' && (isTeamLead || (mine && canContribute));
            // Your own slider is always open; a lead opens anyone else's by clicking the row
            const open = canEdit && (mine || editing === item.id);
            return (
              <li key={item.id} className={mine ? 'bg-neutral-50' : ''}>
                <button
                  type="button"
                  disabled={!isTeamLead || !canEdit || mine}
                  onClick={() => setEditing(editing === item.id ? null : item.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left enabled:cursor-pointer enabled:hover:bg-neutral-50"
                >
                  <Avatar name={person?.name ?? '?'} avatar={person?.avatar} className="size-7 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-black">
                      {person?.name ?? '-'}
                      {mine && <span className="ml-1 font-normal text-neutral-500">({t.teamTaskYou})</span>}
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <span className="block h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${item.progress}%` }} />
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[item.status]}`}>{statusLabel[item.status]}</span>
                    <span className="text-[10px] font-semibold text-neutral-500 font-mono-numbers">{item.progress}%</span>
                  </span>
                </button>
                {item.memberNotes && <p className="line-clamp-2 px-3 pb-2 pl-12 text-[11px] text-neutral-500">{item.memberNotes}</p>}
                {open && (
                  <div className="animate-rise px-3 pb-3 pl-12">
                    <TaskProgress value={item.progress} editable onCommit={value => onProgress(item.id, value)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-xs">
        <span className={`inline-flex items-center gap-1.5 font-medium ${deadline.overdue ? 'text-brand' : 'text-neutral-600'}`}>
          <Icons.time className="size-3.5" />
          {first.dueDate}
          {first.dueTime ? ` ${first.dueTime}` : ''} · {deadline.text}
        </span>
        <button type="button" onClick={onOpenIndividual} className="cursor-pointer font-semibold text-brand hover:underline">
          {t.teamTaskOpen}
        </button>
      </div>
    </div>
  );
};
