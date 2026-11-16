import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { daysUntil } from '../lib/dates';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { User as UserIcon } from 'lucide-react';
import { Avatar } from './Avatar';
import { FilterSelect, Pager, SearchBox } from './TableParts';
import { useTableView } from '../lib/useTableView';
import { CommentThread } from './CommentThread';
import { EditableDate } from './EditableDate';
import { TaskProgress } from './TaskProgress';
import { TeamTaskCard } from './TeamTaskCard';
import { Icons } from './icons';

interface TaskBoardProps {
  onOpenAssignTask: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  onOpenAssignTask,
}) => {
  const {
    activeGroupTasks,
    activeGroupMembers,
    users,
    currentUser,
    isTeamLead,
    canContribute,
    updateTaskStatus,
    updateTaskProgress,
    deleteTeamTask,
    updateTaskDeadline,
    approveTask,
    reassignTask,
    deleteTask,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
  const [leaderFeedback, setLeaderFeedback] = useState('');
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  // Viewers cannot work on tasks
  const assignableMembers = activeGroupMembers.filter(m => m.role !== 'viewer');

  const categories = Array.from(new Set(activeGroupTasks.map(t => t.module))).filter(Boolean);

  const filteredTasks = activeGroupTasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (assigneeFilter !== 'all' && task.assignedTo !== assigneeFilter) return false;
    if (batchFilter && task.batchId !== batchFilter) return false;
    if (categoryFilter !== 'all' && task.module.toLowerCase() !== categoryFilter.toLowerCase()) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const assignee = users.find(u => u.id === task.assignedTo);
      const match =
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.module.toLowerCase().includes(q) ||
        (assignee && assignee.name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Progress of tasks that were given to several people at once
  const batchStats = new Map<string, { done: number; total: number; sum: number; tasks: Task[] }>();
  for (const task of activeGroupTasks) {
    if (!task.batchId) continue;
    const entry = batchStats.get(task.batchId) ?? { done: 0, total: 0, sum: 0, tasks: [] };
    entry.total += 1;
    entry.sum += task.progress;
    entry.tasks.push(task);
    if (task.status === 'ready_for_review' || task.status === 'approved') entry.done += 1;
    batchStats.set(task.batchId, entry);
  }

  // A task given to several people is one card, unless the list is already narrowed to a person or to that team task
  type Row = { task: Task; team?: Task[] };
  const groupTeams = batchFilter === null && assigneeFilter === 'all';
  const rows: Row[] = [];
  const seenBatches = new Set<string>();
  for (const task of filteredTasks) {
    if (groupTeams && task.batchId) {
      if (seenBatches.has(task.batchId)) continue;
      seenBatches.add(task.batchId);
      rows.push({ task, team: batchStats.get(task.batchId)!.tasks });
    } else {
      rows.push({ task });
    }
  }

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
  const STATUS_ORDER = { todo: 0, in_progress: 1, ready_for_review: 2, approved: 3 } as const;
  const view = useTableView(rows, {
    searchText: () => '',
    compare: {
      due: (a, b) => `${a.task.dueDate} ${a.task.dueTime ?? ''}`.localeCompare(`${b.task.dueDate} ${b.task.dueTime ?? ''}`),
      priority: (a, b) => PRIORITY_ORDER[a.task.priority] - PRIORITY_ORDER[b.task.priority],
      status: (a, b) => STATUS_ORDER[a.task.status] - STATUS_ORDER[b.task.status],
      created: (a, b) => a.task.createdAt.localeCompare(b.task.createdAt),
    },
    initialSort: { key: 'due', dir: 'asc' },
    pageSize: 8,
  });
  const sortValue = `${view.sort.key}:${view.sort.dir}`;

  const isAnyFilterActive =
    statusFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    batchFilter !== null ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setStatusFilter('all');
    setAssigneeFilter('all');
    setCategoryFilter('all');
    setBatchFilter(null);
    setSearchQuery('');
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          label: t.taskPriorityUrgent,
          className: 'bg-brand text-white font-bold',
        };
      case 'high':
        return {
          label: t.taskPriorityHigh,
          className: 'bg-neutral-200 text-black font-semibold',
        };
      case 'medium':
        return {
          label: t.taskPriorityMedium,
          className: 'bg-neutral-100 text-black',
        };
      case 'low':
      default:
        return {
          label: t.taskPriorityLow,
          className: 'bg-neutral-100 text-neutral-600',
        };
    }
  };

  const getDeadlineStatus = (dueDate: string) => {
    const diffDays = daysUntil(dueDate);

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} ${t.daysOverdue}`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: t.dueToday, isToday: true };
    } else {
      return { text: `${diffDays} ${t.daysLeft}`, isUpcoming: true };
    }
  };

  const handleMarkAsDoneSubmit = (taskId: string) => {
    updateTaskStatus(taskId, 'ready_for_review', completionNote.trim() || undefined);
    setCompletingTaskId(null);
    setCompletionNote('');
  };

  const handleApproveSubmit = (taskId: string) => {
    approveTask(taskId, leaderFeedback.trim() || undefined);
    setApprovingTaskId(null);
    setLeaderFeedback('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={t.searchTasks} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs">
              <Icons.group className="size-3 text-neutral-500" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-black focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {t.filterAllCategories}
                </option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs">
              <UserIcon className="size-3 text-neutral-500" />
              <select
                value={assigneeFilter}
                onChange={e => setAssigneeFilter(e.target.value)}
                className="bg-transparent text-xs text-black focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {t.filterAllAssignees}
                </option>
                {activeGroupMembers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {isTeamLead && (
              <button
                onClick={onOpenAssignTask}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Icons.add className="size-3.5" />
                <span>{t.assignNewTask}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.all} ({activeGroupTasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('todo')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'todo'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusTodo}
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusInProgress}
            </button>
            <button
              onClick={() => setStatusFilter('ready_for_review')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'ready_for_review'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusReview}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusApproved}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <FilterSelect
              value={sortValue}
              onChange={v => {
                const [key, dir] = v.split(':');
                view.setSort(key, dir as 'asc' | 'desc');
              }}
              options={[
                { value: 'due:asc', label: t.sortDueSoon },
                { value: 'due:desc', label: t.sortDueLate },
                { value: 'priority:asc', label: t.sortPriority },
                { value: 'status:asc', label: t.sortStatus },
                { value: 'created:desc', label: t.sortNewest },
              ]}
            />
            <span className="text-[11px] text-neutral-500">
              {rows.length} {t.tasksShown}
            </span>

            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-neutral-600 hover:text-black hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Icons.close className="size-3" />
                <span>{t.filterClear}</span>
              </button>
            )}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-[11px] text-neutral-400 mr-1 flex items-center gap-1 font-medium">
              <Icons.group className="size-3" />
              <span>{t.categoryLabel}</span>
            </span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {t.adminAllStatus}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium cursor-pointer ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-brand text-white font-semibold'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {batchFilter && batchStats.get(batchFilter) && (() => {
        const { total, sum, done } = batchStats.get(batchFilter)!;
        return (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-2.5 text-xs text-brand">
            <Icons.members className="size-4 shrink-0" />
            <span className="font-semibold">
              {t.teamTaskViewing} · {t.teamTaskPeople.replace('{n}', String(total))}
            </span>
            <span className="font-bold font-mono-numbers">
              {Math.round(sum / total)}% · {t.teamTaskDone.replace('{done}', String(done)).replace('{total}', String(total))}
            </span>
            <button type="button" onClick={() => setBatchFilter(null)} className="ml-auto cursor-pointer font-semibold hover:underline">
              {t.teamTaskBack}
            </button>
          </div>
        );
      })()}

      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Icons.time className="size-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-black">
            {isAnyFilterActive
              ? (t.noTasksMatch)
              : t.noTasksFound}
          </p>
          {isAnyFilterActive ? (
            <button
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Icons.close className="size-3.5" />
              <span>{t.filterReset}</span>
            </button>
          ) : isTeamLead ? (
            <button
              onClick={onOpenAssignTask}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark transition-colors cursor-pointer"
            >
              <Icons.add className="size-3.5" />
              <span>{t.assignNewTask}</span>
            </button>
          ) : null}
        </div>
      ) : (
        <>
        <div className="stagger grid grid-cols-1 md:grid-cols-2 gap-4">
          {view.pageRows.map(row => {
            const task = row.task;
            if (row.team) {
              const deadlineInfo = getDeadlineStatus(task.dueDate);
              return (
                <TeamTaskCard
                  key={`team-${task.batchId}`}
                  tasks={row.team}
                  users={users}
                  priority={getPriorityBadge(task.priority)}
                  deadline={{ text: deadlineInfo.text, overdue: !!deadlineInfo.isOverdue }}
                  onProgress={(id, value) => updateTaskProgress(id, value)}
                  onOpenIndividual={() => setBatchFilter(task.batchId!)}
                  onDelete={() => deleteTeamTask(task.batchId!)}
                />
              );
            }
            const assignee = users.find(u => u.id === task.assignedTo) || {
              id: task.assignedTo,
              name: 'Unassigned',
              email: '',
              role: 'member',
            };

            const canWorkOnTask = isTeamLead || (canContribute && task.assignedTo === currentUser.id);
            const priorityBadge = getPriorityBadge(task.priority);
            const deadlineInfo = getDeadlineStatus(task.dueDate);

            return (
              <div
                key={task.id}
                className="lift bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setCategoryFilter(task.module)}
                      className="text-xs font-semibold text-black bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                      title={t.titleFilterCategory}
                    >
                      {task.module}
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] uppercase px-2 py-0.5 rounded-lg ${priorityBadge.className}`}
                      >
                        {priorityBadge.label}
                      </span>

                      {isTeamLead && (
                        <button
                          onClick={() => {
                            if (confirm(t.deleteTaskConfirm)) {
                              deleteTask(task.id);
                            }
                          }}
                          className="text-neutral-400 hover:text-black p-0.5 transition-colors cursor-pointer"
                          title={t.delete}
                        >
                          <Icons.remove className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3
                      className={`text-base font-bold tracking-tight ${
                        task.status === 'approved'
                          ? 'text-neutral-500 line-through'
                          : 'text-black'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-3 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>

                <TaskProgress
                  value={task.progress}
                  editable={canWorkOnTask && task.status !== 'approved'}
                  onCommit={value => updateTaskProgress(task.id, value)}
                />

                {task.memberNotes && (
                  <div className="p-2.5 bg-neutral-50 rounded-lg text-xs text-black">
                    <span className="font-bold block mb-0.5">
                      {t.memberNotesLabel}
                    </span>
                    <span>{task.memberNotes}</span>
                  </div>
                )}

                {task.leaderFeedback && (
                  <div className="p-2.5 bg-neutral-50 rounded-lg text-xs text-black">
                    <div className="flex items-center gap-1 font-bold mb-0.5">
                      <Icons.approved className="size-3.5 text-black" />
                      <span>{t.leaderFeedbackText}{t.colon}</span>
                    </div>
                    <span>{task.leaderFeedback}</span>
                  </div>
                )}

                <div className="pt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div
                      onClick={() => setAssigneeFilter(assignee.id)}
                      className="flex items-center gap-2 cursor-pointer group"
                      title={t.titleFilterMember}
                    >
                      <Avatar name={assignee.name} avatar={assignee.avatar} className="size-6" />
                      <div className="truncate">
                        <span className="font-semibold text-black block truncate max-w-[130px] group-hover:underline">
                          {assignee.name}
                        </span>
                        <span className="text-[11px] text-neutral-500 truncate block max-w-[130px]">
                          {assignee.email}
                        </span>
                      </div>
                    </div>

                    {isTeamLead && task.status !== 'approved' && (
                      reassigningTaskId === task.id ? (
                        <select
                          autoFocus
                          // A member who left is no longer in the list
                          value={assignableMembers.some(m => m.id === task.assignedTo) ? task.assignedTo : ''}
                          onChange={e => {
                            reassignTask(task.id, e.target.value);
                            setReassigningTaskId(null);
                          }}
                          onBlur={() => setReassigningTaskId(null)}
                          className="max-w-[120px] rounded-lg border border-neutral-200 bg-white px-1.5 py-1 text-[11px] text-black focus:outline-none focus:ring-1 focus:ring-brand/40"
                        >
                          <option value="" disabled>
                            {t.taskAssignTo}
                          </option>
                          {assignableMembers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setReassigningTaskId(task.id)}
                          className="text-[11px] font-semibold text-neutral-500 hover:text-black hover:underline cursor-pointer"
                        >
                          {t.reassignTask}
                        </button>
                      )
                    )}

                    <div className="text-right">
                      <EditableDate value={task.dueDate} canEdit={isTeamLead} onSave={date => updateTaskDeadline(task.id, date)} size="sm" className="justify-end">
                        <Icons.date className="size-3.5 text-neutral-500" />
                        <span>
                          <span className="block font-mono font-medium text-black">
                            {task.dueDate} {task.dueTime}
                          </span>
                          <span className="text-[11px] font-semibold text-neutral-700">{deadlineInfo.text}</span>
                        </span>
                      </EditableDate>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      {task.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand px-2 py-0.5 rounded-lg">
                          <Icons.done className="size-3.5 text-white" />
                          <span>{t.taskStatusApproved}</span>
                        </span>
                      )}
                      {task.status === 'ready_for_review' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-black bg-neutral-200 px-2 py-0.5 rounded-lg">
                          <Icons.time className="size-3.5 text-black" />
                          <span>{t.taskStatusReview}</span>
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-lg">
                          <span>{t.taskStatusInProgress}</span>
                        </span>
                      )}
                      {task.status === 'todo' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-lg">
                          <span>{t.taskStatusTodo}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canWorkOnTask && task.status === 'todo' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>{t.startTask}</span>
                        </button>
                      )}
                      {canWorkOnTask && task.status !== 'approved' && task.status !== 'ready_for_review' && (
                        <button
                          onClick={() => setCompletingTaskId(task.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icons.confirm className="size-3.5" />
                          <span>{t.btnMarkDone}</span>
                        </button>
                      )}

                      {isTeamLead && task.status === 'ready_for_review' && (
                        <button
                          onClick={() => setApprovingTaskId(task.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          <Icons.approved className="size-3.5" />
                          <span>{t.btnApproveTask}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {completingTaskId === task.id && canWorkOnTask && (
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-black">
                        <span>{t.submitTaskDone}</span>
                        <button
                          onClick={() => setCompletingTaskId(null)}
                          className="text-neutral-500 hover:text-black"
                        >
                          {t.cancel}
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={completionNote}
                        onChange={e => setCompletionNote(e.target.value)}
                        placeholder={t.placeholderNote}
                        className="w-full p-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
                      />
                      <button
                        onClick={() => handleMarkAsDoneSubmit(task.id)}
                        className="w-full py-1.5 bg-brand hover:bg-brand-dark text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {t.btnSubmitReview}
                      </button>
                    </div>
                  )}

                  {approvingTaskId === task.id && isTeamLead && (
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-black">
                        <span>{t.approveTaskDone}</span>
                        <button
                          onClick={() => setApprovingTaskId(null)}
                          className="text-neutral-500 hover:text-black"
                        >
                          {t.cancel}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={leaderFeedback}
                        onChange={e => setLeaderFeedback(e.target.value)}
                        placeholder={t.placeholderFeedback}
                        className="w-full p-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
                      />
                      <button
                        onClick={() => handleApproveSubmit(task.id)}
                        className="w-full py-1.5 bg-brand hover:bg-brand-dark text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {t.btnApproveTask}
                      </button>
                    </div>
                  )}
                </div>

                <CommentThread kind="task" targetId={task.id} count={task.commentCount ?? 0} />
              </div>
            );
          })}
        </div>
        <Pager page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage} />
        </>
      )}
    </div>
  );
};
