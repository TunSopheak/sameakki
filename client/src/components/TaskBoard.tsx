import { ExpandableText } from './ExpandableText';
import { moduleName, taskDescription } from '../lib/defaults';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { daysUntil, todayLocal } from '../lib/dates';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { User as UserIcon } from 'lucide-react';
import { Avatar } from './Avatar';
import { FilterSelect, Pager, SearchBox } from './TableParts';
import { SelectMenu, SELECT_FILTER } from './pickers/SelectMenu';
import { useTableView } from '../lib/useTableView';
import { CommentThread } from './CommentThread';
import { EditableDate } from './EditableDate';
import { TaskProgress } from './TaskProgress';
import { TeamTaskBanner } from './TeamTaskBanner';
import { TeamTaskCard } from './TeamTaskCard';
import { groupTeamTasks, type TaskLine } from '../lib/stats';
import { cardCount, matchesScope, matchesWhen, myBatches, type Scope, type When } from '../lib/taskFilters';
import { DatePicker } from './pickers/DatePicker';
import { FilterPanel, SegmentGroup, StatusChips } from './FilterControls';
import { peekPagePreset } from '../lib/pagePreset';
import { Icons } from './icons';
import { EditTaskModal } from './EditTaskModal';
import { ImportTasksModal } from './ImportTasksModal';

interface TaskBoardProps {
  onOpenAssignTask: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  onOpenAssignTask,
}) => {
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<{ task: Task; size: number } | null>(null);
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
    reopenTask,
    requestTaskChanges,
    approveTasks,
    reassignTask,
    deleteTask,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // A card on the Overview can open this page already filtered
  const [preset] = useState(() => peekPagePreset('tasks'));
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>((preset?.status as TaskStatus | undefined) ?? 'all');
  const [moreOpen, setMoreOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [scope, setScope] = useState<Scope>(preset?.scope ?? 'all');
  const [when, setWhen] = useState<When>(preset?.when ?? 'any');
  const [range, setRange] = useState({ from: '', to: '' });
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
  const [leaderFeedback, setLeaderFeedback] = useState('');
  // Viewers cannot work on tasks
  const assignableMembers = activeGroupMembers.filter(m => m.role !== 'viewer');

  const categories = Array.from(new Set(activeGroupTasks.map(t => t.module))).filter(Boolean);

  const today = todayLocal();
  const mine = myBatches(activeGroupTasks, currentUser.id);

  // Every filter except the one named, so each button can show how many cards it would give
  const matchesOthers = (task: Task, skip?: 'scope' | 'when') => {
    if (assigneeFilter !== 'all' && task.assignedTo !== assigneeFilter) return false;
    if (skip !== 'scope' && !matchesScope(task, scope, currentUser.id, mine)) return false;
    if (skip !== 'when' && !matchesWhen(task, when, today, range)) return false;
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
  };

  const otherMatches = activeGroupTasks.filter(task => matchesOthers(task));
  const filteredTasks = statusFilter === 'all' ? otherMatches : otherMatches.filter(task => task.status === statusFilter);
  const statusCount = (status: 'all' | TaskStatus) => cardCount(status === 'all' ? otherMatches : otherMatches.filter(task => task.status === status));
  const extraCount = Number(assigneeFilter !== 'all') + Number(categoryFilter !== 'all');
  const whenCount = (value: When) => cardCount(activeGroupTasks.filter(task => matchesOthers(task, 'when') && matchesWhen(task, value, today, range)));

  // A team task is one card, unless the list is narrowed to a person or one team task
  const groupTeams = batchFilter === null && assigneeFilter === 'all';
  const rows: TaskLine[] = groupTeams ? groupTeamTasks(filteredTasks, activeGroupTasks) : filteredTasks.map(task => ({ task }));

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
    scope !== 'all' ||
    when !== 'any' ||
    assigneeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    batchFilter !== null ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setStatusFilter('all');
    setScope('all');
    setWhen('any');
    setRange({ from: '', to: '' });
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

  const handleRequestChanges = (taskId: string) => {
    if (!leaderFeedback.trim()) return;
    requestTaskChanges(taskId, leaderFeedback.trim());
    setApprovingTaskId(null);
    setLeaderFeedback('');
  };

  // Everything in view that is waiting for the leader
  const waitingIds = otherMatches.filter(task => task.status === 'ready_for_review').map(task => task.id);
  const handleApproveAll = () => {
    if (waitingIds.length > 0 && confirm(t.approveAllConfirm.replace('{n}', String(waitingIds.length)))) approveTasks(waitingIds);
  };

  const handleApproveSubmit = (taskId: string) => {
    approveTask(taskId, leaderFeedback.trim() || undefined);
    setApprovingTaskId(null);
    setLeaderFeedback('');
  };

  return (
    <div className="space-y-4">
      <FilterPanel>
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={t.searchTasks} />
          {isTeamLead && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-100"
              >
                <Icons.excel className="size-3.5" />
                <span>{t.importTasks}</span>
              </button>
              <button
                onClick={onOpenAssignTask}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark"
              >
                <Icons.add className="size-3.5" />
                <span>{t.assignNewTask}</span>
              </button>
              <ImportTasksModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
              <EditTaskModal task={editing?.task ?? null} teamSize={editing?.size} onClose={() => setEditing(null)} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          <SegmentGroup
            label={t.filterScopeLabel}
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: t.all },
              { value: 'mine', label: t.filterScopeMine },
              { value: 'team', label: t.filterScopeTeam },
            ]}
          />

          <SegmentGroup
            label={t.filterWhenLabel}
            value={when}
            onChange={setWhen}
            options={[
              { value: 'any', label: t.filterAnyTime },
              { value: 'today', label: t.filterToday, count: whenCount('today') },
              { value: 'overdue', label: t.filterOverdue, count: whenCount('overdue'), warn: true },
              { value: 'range', label: t.filterRange, icon: <Icons.date className="size-3.5" /> },
            ]}
          />

          {when === 'range' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-neutral-600">{t.filterFrom}</span>
              <DatePicker value={range.from} onChange={from => setRange(r => ({ ...r, from, to: r.to && from && r.to < from ? from : r.to }))} max={range.to || undefined} clearable placeholder={t.filterAnyDate} className="w-40" />
              <span className="font-semibold text-neutral-600">{t.filterTo}</span>
              <DatePicker value={range.to} onChange={to => setRange(r => ({ ...r, to }))} min={range.from || undefined} clearable placeholder={t.filterAnyDate} className="w-40" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-xs">
          <StatusChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t.all, count: statusCount('all') },
              { value: 'todo', label: t.taskStatusTodo, count: statusCount('todo') },
              { value: 'in_progress', label: t.taskStatusInProgress, count: statusCount('in_progress') },
              { value: 'ready_for_review', label: t.taskStatusReview, count: statusCount('ready_for_review') },
              { value: 'approved', label: t.taskStatusApproved, count: statusCount('approved') },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            {isTeamLead && waitingIds.length > 0 && (
              <button
                onClick={handleApproveAll}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand px-2.5 py-1 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-soft"
              >
                <Icons.approved className="size-3.5" />
                {t.btnApproveAll.replace('{n}', String(waitingIds.length))}
              </button>
            )}
            <button
              onClick={() => setMoreOpen(o => !o)}
              aria-expanded={moreOpen}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              {t.filterMore}
              {extraCount > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] text-white">{extraCount}</span>}
              <Icons.expand className={`size-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setRulesOpen(o => !o)}
              aria-expanded={rulesOpen}
              title={t.taskRulesTitle}
              aria-label={t.taskRulesTitle}
              className={`cursor-pointer rounded-lg p-1.5 transition-colors ${rulesOpen ? 'bg-neutral-100 text-brand-ink' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`}
            >
              <Icons.tip className="size-4" />
            </button>
          </div>
        </div>

        {moreOpen && (
          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 text-xs">
            <SelectMenu
              value={assigneeFilter}
              label={t.colAssignee}
              className={SELECT_FILTER}
              icon={<UserIcon className="size-3.5 text-neutral-500" />}
              onChange={setAssigneeFilter}
              options={[
                { value: 'all', label: t.filterAllAssignees },
                ...activeGroupMembers.map(u => ({ value: u.id, label: u.name, avatar: <Avatar name={u.name} avatar={u.avatar} className="size-6" /> })),
              ]}
            />
            {categories.length > 1 && (
              <SelectMenu
                value={categoryFilter}
                label={t.categoryLabel}
                className={SELECT_FILTER}
                icon={<Icons.group className="size-3.5 text-neutral-500" />}
                onChange={setCategoryFilter}
                options={[{ value: 'all', label: t.filterAllCategories }, ...categories.map(cat => ({ value: cat, label: moduleName(cat, t) }))]}
              />
            )}
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
          </div>
        )}

        {isAnyFilterActive && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
            <span>
              {rows.length} {t.tasksShown}
            </span>
            <button onClick={handleResetFilters} className="flex cursor-pointer items-center gap-1 font-semibold text-neutral-600 hover:text-black hover:underline">
              <Icons.close className="size-3" />
              <span>{t.filterClear}</span>
            </button>
          </div>
        )}
      </FilterPanel>

      {rulesOpen && (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs">
          <p className="mb-2 font-bold text-black">{t.taskRulesTitle}</p>
          <div className="mb-3 flex flex-wrap items-center gap-1.5 font-semibold">
            {[t.taskStatusTodo, t.taskStatusInProgress, t.taskStatusReview, t.taskStatusApproved].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <Icons.forward className="size-3.5 text-neutral-400" />}
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-black">{label}</span>
              </React.Fragment>
            ))}
          </div>
          <ol className="list-decimal space-y-1 pl-5 leading-relaxed text-neutral-700">
            {[t.taskRuleCreate, t.taskRuleProgress, t.taskRuleReview, t.taskRuleLocked, t.taskRuleLate, t.taskRuleTeam].map(rule => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </div>
      )}

      {batchFilter && (
        <TeamTaskBanner tasks={activeGroupTasks.filter(task => task.batchId === batchFilter)} onBack={() => setBatchFilter(null)} />
      )}

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
        {[
          { key: 'team', title: t.sectionTeamTasks, rows: view.pageRows.filter(row => row.team) },
          { key: 'single', title: t.sectionIndividualTasks, rows: view.pageRows.filter(row => !row.team) },
        ]
          .filter(group => group.rows.length > 0)
          .map((group, _index, groups) => (
          <section key={group.key} className="space-y-3">
            {groups.length > 1 && (
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-neutral-600">
                {group.title}
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-black font-mono-numbers">{group.rows.length}</span>
              </h2>
            )}
        <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2">
          {group.rows.map(row => {
            const task = row.task;
            if (row.team) {
              const deadlineInfo = getDeadlineStatus(task.dueDate);
              return (
                <TeamTaskCard
                  key={`team-${task.batchId}`}
                  tasks={row.team}
                  users={users}
                  priority={getPriorityBadge(task.priority)}
                  deadline={row.team.every(item => item.status === 'ready_for_review' || item.status === 'approved') ? null : { text: deadlineInfo.text, overdue: !!deadlineInfo.isOverdue }}
                  onProgress={(id, value) => updateTaskProgress(id, value)}
                  onOpenIndividual={() => setBatchFilter(task.batchId!)}
                  onDelete={() => deleteTeamTask(task.batchId!)}
                  onDeadline={date => updateTaskDeadline(task.id, date)}
                  onEdit={() => setEditing({ task: row.team!.find(item => item.status !== 'approved') ?? task, size: row.team!.length })}
                />
              );
            }
            const assignee = users.find(u => u.id === task.assignedTo) || {
              id: task.assignedTo,
              name: t.ganttNobody,
              email: '',
              role: 'member',
            };

            const canWorkOnTask = isTeamLead || (canContribute && task.assignedTo === currentUser.id);
            const priorityBadge = getPriorityBadge(task.priority);
            const deadlineInfo = getDeadlineStatus(task.dueDate);

            return (
              <div
                key={task.id}
                className="lift flex h-full flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setCategoryFilter(task.module)}
                      className="text-xs font-semibold text-black bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                      title={t.titleFilterCategory}
                    >
                      {moduleName(task.module, t)}
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] uppercase px-2 py-0.5 rounded-lg ${priorityBadge.className}`}
                      >
                        {priorityBadge.label}
                      </span>

                      {isTeamLead && task.status !== 'approved' && (
                        <button
                          onClick={() => setEditing({ task, size: 1 })}
                          className="text-neutral-400 hover:text-black p-0.5 transition-colors cursor-pointer"
                          title={t.editTask}
                          aria-label={t.editTask}
                        >
                          <Icons.edit className="size-3.5" />
                        </button>
                      )}

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
                    <ExpandableText text={taskDescription(task.description)} lines={2} className="mt-1 text-xs leading-relaxed text-neutral-600" />
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

                <div className="mt-auto space-y-3 border-t border-neutral-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs">
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
                      <SelectMenu
                        // A member who left is no longer in the list
                        value={assignableMembers.some(m => m.id === task.assignedTo) ? task.assignedTo : ''}
                        label={t.taskAssignTo}
                        display={t.reassignTask}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 transition-colors hover:text-black"
                        onChange={id => reassignTask(task.id, id)}
                        options={assignableMembers.map(m => ({
                          value: m.id,
                          label: m.name,
                          avatar: <Avatar name={m.name} avatar={m.avatar} className="size-6" />,
                        }))}
                      />
                    )}

                    {/* Submitted or approved work is not counted down or called late */}
                    <EditableDate
                      value={task.dueDate}
                      canEdit={isTeamLead && task.status !== 'approved'}
                      onSave={date => updateTaskDeadline(task.id, date)}
                      className={`ml-auto gap-2.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
                        deadlineInfo.isOverdue && task.status !== 'approved' && task.status !== 'ready_for_review'
                          ? 'border-brand/30 bg-brand-soft'
                          : 'border-neutral-200 bg-neutral-50'
                      } ${isTeamLead && task.status !== 'approved' ? 'hover:border-brand/40 hover:bg-white' : ''}`}
                    >
                      <Icons.date className="size-4 shrink-0 text-neutral-500" />
                      <span className="flex flex-col leading-tight">
                        <span className="whitespace-nowrap font-mono-numbers text-xs font-semibold text-black">
                          {task.dueDate}
                          {task.dueTime ? ` · ${task.dueTime}` : ''}
                        </span>
                        {task.status !== 'approved' && task.status !== 'ready_for_review' && (
                          <span className={`text-[11px] font-semibold ${deadlineInfo.isOverdue ? 'text-brand-ink' : 'text-neutral-600'}`}>{deadlineInfo.text}</span>
                        )}
                      </span>
                    </EditableDate>
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

                      {isTeamLead && task.status === 'approved' && (
                        <button
                          onClick={() => reopenTask(task.id)}
                          title={t.approvedLockedHint}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icons.edit className="size-3.5" />
                          <span>{t.btnReopen}</span>
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
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleRequestChanges(task.id)}
                          disabled={!leaderFeedback.trim()}
                          title={t.changesPlaceholder}
                          className="py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:cursor-default disabled:opacity-50"
                        >
                          {t.btnRequestChanges}
                        </button>
                        <button
                          onClick={() => handleApproveSubmit(task.id)}
                          className="py-1.5 bg-brand hover:bg-brand-dark text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          {t.btnApproveTask}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <CommentThread kind="task" targetId={task.id} count={task.commentCount ?? 0} />
              </div>
            );
          })}
        </div>
          </section>
          ))}
        <Pager page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage} />
        </>
      )}
    </div>
  );
};
