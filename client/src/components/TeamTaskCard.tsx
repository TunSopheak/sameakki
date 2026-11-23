import { ExpandableText } from './ExpandableText';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateShort } from '../lib/dates';
import { moduleName, taskDescription } from '../lib/defaults';
import { averageProgress } from '../lib/stats';
import { STATUS_ORDER } from '../lib/taskStatus';
import type { Task, User } from '../types';
import { EditableDate } from './EditableDate';
import { Avatar } from './Avatar';
import { Icons } from './icons';
import { SelectMenu } from './pickers/SelectMenu';
import { TeamMemberRow } from './TeamMemberRow';

interface TeamTaskCardProps {
  tasks: Task[];
  users: User[];
  priority: { label: string; className: string };
  /** Null when everyone has finished */
  deadline: { text: string; overdue: boolean } | null;
  onProgress: (taskId: string, value: number) => Promise<void> | void;
  onOpenIndividual: () => void;
  onDelete: () => void;
  /** Members who do not have this task yet */
  addable: User[];
  onAddMember: (userId: string) => void;
  onRemoveMember: (taskId: string) => void;
  onEdit: () => void;
  /** A leader picks a new due date for everyone */
  onDeadline: (date: string) => void;
}

/** One card for a task given to several people. */
export const TeamTaskCard: React.FC<TeamTaskCardProps> = ({ tasks, users, priority, deadline, onProgress, onOpenIndividual, onDelete, addable, onAddMember, onRemoveMember, onEdit, onDeadline }) => {
  const { t, language, currentUser, isTeamLead, canContribute } = useApp();
  const [editing, setEditing] = useState<string | null>(null);

  const first = tasks[0];
  const percent = averageProgress(tasks);
  const done = tasks.filter(task => task.status === 'ready_for_review' || task.status === 'approved').length;
  const doing = tasks.filter(task => task.status === 'in_progress').length;

  const nameOf = (id: string) => users.find(u => u.id === id)?.name ?? '';
  // Your own part first, then the ones still to do
  const members = [...tasks].sort(
    (a, b) =>
      Number(b.assignedTo === currentUser.id) - Number(a.assignedTo === currentUser.id) ||
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      nameOf(a.assignedTo).localeCompare(nameOf(b.assignedTo))
  );

  return (
    <div className="lift flex h-full flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-ink">
              <Icons.members className="size-3.5" />
              {t.teamTask} · {t.teamTaskPeople.replace('{n}', String(tasks.length))}
            </span>
            <span className="truncate rounded-lg bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-black">{moduleName(first.module, t)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-lg px-2 py-0.5 text-[11px] uppercase ${priority.className}`}>{priority.label}</span>
            {isTeamLead && tasks.some(task => task.status !== 'approved') && (
              <button type="button" onClick={onEdit} title={t.editTask} aria-label={t.editTask} className="-m-1 cursor-pointer p-1.5 text-neutral-400 transition-colors hover:text-black sm:m-0 sm:p-0.5">
                <Icons.edit className="size-3.5" />
              </button>
            )}
            {isTeamLead && (
              <button
                type="button"
                onClick={() => confirm(t.teamTaskDeleteConfirm.replace('{n}', String(tasks.length))) && onDelete()}
                title={t.delete}
                aria-label={t.delete}
                className="-m-1 cursor-pointer p-1.5 text-neutral-400 transition-colors hover:text-black sm:m-0 sm:p-0.5"
              >
                <Icons.remove className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold tracking-tight text-black">{first.title}</h3>
        <ExpandableText text={taskDescription(first.description)} lines={2} className="text-xs leading-relaxed text-neutral-600" />
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
          {t.teamTaskStats
            .replace('{done}', String(done))
            .replace('{doing}', String(doing))
            .replace('{todo}', String(tasks.length - done - doing))}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5 text-[11px] font-semibold text-neutral-500">
          <span>{t.teamTaskMembers}</span>
          {isTeamLead && tasks.some(task => task.status !== 'approved') && (
            <SelectMenu
              value=""
              label={t.teamAddMember}
              display={`+ ${t.teamAddMember}`}
              disabled={addable.length === 0}
              className="-my-1 inline-flex cursor-pointer items-center gap-1 py-1.5 text-[11px] font-semibold text-brand-ink hover:underline disabled:cursor-default disabled:opacity-40 disabled:no-underline"
              onChange={onAddMember}
              options={addable.map(m => ({ value: m.id, label: m.name, avatar: <Avatar name={m.name} avatar={m.avatar} className="size-6" /> }))}
            />
          )}
        </div>
        <ul className="max-h-72 divide-y divide-neutral-100 overflow-y-auto">
          {members.map(task => {
            const isMe = task.assignedTo === currentUser.id;
            const canEdit = task.status !== 'approved' && (isTeamLead || (isMe && canContribute));
            return (
              <TeamMemberRow
                key={task.id}
                task={task}
                person={users.find(u => u.id === task.assignedTo)}
                isMe={isMe}
                canEdit={canEdit}
                open={canEdit && (isMe || editing === task.id)}
                onToggle={() => setEditing(editing === task.id ? null : task.id)}
                onProgress={onProgress}
                onRemove={isTeamLead && task.status !== 'approved' ? () => onRemoveMember(task.id) : undefined}
              />
            );
          })}
        </ul>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-neutral-100 pt-3 text-xs">
        <EditableDate
          value={first.dueDate}
          canEdit={isTeamLead && tasks.some(task => task.status !== 'approved')}
          onSave={onDeadline}
          className={`max-w-full gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-2 sm:py-0.5 ${
            deadline?.overdue ? 'bg-brand-soft text-brand-ink hover:bg-brand/20' : 'bg-neutral-100 text-black hover:bg-neutral-200'
          }`}
        >
          <Icons.date className="size-3.5 shrink-0" />
          <span className="min-w-0">
            <span className="whitespace-nowrap">
              {formatDateShort(first.dueDate, language)}
              {first.dueTime ? ` · ${first.dueTime}` : ''}
            </span>
            {deadline && <span className="ml-1 whitespace-nowrap font-medium opacity-70">({deadline.text})</span>}
          </span>
        </EditableDate>
        <button type="button" onClick={onOpenIndividual} className="cursor-pointer py-1.5 font-semibold text-brand-ink hover:underline sm:py-0">
          {t.teamTaskOpen}
        </button>
      </div>
    </div>
  );
};
