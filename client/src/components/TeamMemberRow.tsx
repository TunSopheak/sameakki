import React from 'react';
import { useApp } from '../context/AppContext';
import { STATUS_STYLE, statusLabels } from '../lib/taskStatus';
import type { Task, User } from '../types';
import { Avatar } from './Avatar';
import { TaskProgress } from './TaskProgress';

interface TeamMemberRowProps {
  task: Task;
  person?: User;
  isMe: boolean;
  canEdit: boolean;
  open: boolean;
  onToggle: () => void;
  onProgress: (taskId: string, value: number) => Promise<void> | void;
}

export const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ task, person, isMe, canEdit, open, onToggle, onProgress }) => {
  const { t, isTeamLead } = useApp();

  return (
    <li className={isMe ? 'bg-neutral-50' : ''}>
      <button
        type="button"
        disabled={!isTeamLead || !canEdit || isMe}
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left enabled:cursor-pointer enabled:hover:bg-neutral-50"
      >
        <Avatar name={person?.name ?? '?'} avatar={person?.avatar} className="size-7 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-black">
            {person?.name ?? '-'}
            {isMe && <span className="ml-1 font-normal text-neutral-500">({t.teamTaskYou})</span>}
          </span>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <span className="block h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${task.progress}%` }} />
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[task.status]}`}>{statusLabels(t)[task.status]}</span>
          <span className="text-[11px] font-semibold text-neutral-500 font-mono-numbers">{task.progress}%</span>
        </span>
      </button>
      {task.memberNotes && <p className="line-clamp-2 px-3 pb-2 pl-12 text-[11px] text-neutral-500">{task.memberNotes}</p>}
      {open && (
        <div className="animate-rise px-3 pb-3 pl-12">
          <TaskProgress value={task.progress} editable onCommit={value => onProgress(task.id, value)} />
        </div>
      )}
    </li>
  );
};
