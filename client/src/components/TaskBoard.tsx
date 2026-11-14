import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { daysUntil } from '../lib/dates';
import type { TaskPriority, TaskStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Check,
  Award,
  X,
  Layers,
  User as UserIcon
} from 'lucide-react';
import { Avatar } from './Avatar';
import { FilterSelect, Pager, SearchBox } from './TableParts';
import { useTableView } from '../lib/useTableView';
import { CommentThread } from './CommentThread';

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
    updateTaskDeadline,
    approveTask,
    deleteTask,
    t,
    language,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
  const [leaderFeedback, setLeaderFeedback] = useState('');
  const [editingDeadlineTaskId, setEditingDeadlineTaskId] = useState<string | null>(null);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');

  const categories = Array.from(new Set(activeGroupTasks.map(t => t.module))).filter(Boolean);

  const filteredTasks = activeGroupTasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (assigneeFilter !== 'all' && task.assignedTo !== assigneeFilter) return false;
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

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
  const STATUS_ORDER = { todo: 0, in_progress: 1, ready_for_review: 2, approved: 3 } as const;
  const view = useTableView(filteredTasks, {
    searchText: () => '',
    compare: {
      due: (a, b) => `${a.dueDate} ${a.dueTime ?? ''}`.localeCompare(`${b.dueDate} ${b.dueTime ?? ''}`),
      priority: (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      created: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    initialSort: { key: 'due', dir: 'asc' },
    pageSize: 8,
  });
  const sortValue = `${view.sort.key}:${view.sort.dir}`;

  const isAnyFilterActive =
    statusFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setStatusFilter('all');
    setAssigneeFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          label: t.taskPriorityUrgent,
          className: 'bg-brand text-white border-brand font-bold',
        };
      case 'high':
        return {
          label: t.taskPriorityHigh,
          className: 'bg-neutral-200 text-black border-neutral-200 font-semibold',
        };
      case 'medium':
        return {
          label: t.taskPriorityMedium,
          className: 'bg-white text-black border-neutral-200',
        };
      case 'low':
      default:
        return {
          label: t.taskPriorityLow,
          className: 'bg-neutral-50 text-neutral-600 border-neutral-200',
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
              <Layers className="w-3 h-3 text-neutral-500" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-black focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {language === 'km' ? 'គ្រប់ផ្នែក' : 'All Categories'}
                </option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs">
              <UserIcon className="w-3 h-3 text-neutral-500" />
              <select
                value={assigneeFilter}
                onChange={e => setAssigneeFilter(e.target.value)}
                className="bg-transparent text-xs text-black focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {language === 'km' ? 'សមាជិកទាំងអស់' : 'All Assignees'}
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
                <Plus className="w-3.5 h-3.5" />
                <span>{t.assignNewTask}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs">
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
              {filteredTasks.length} {language === 'km' ? 'កិច្ចការត្រូវបានបង្ហាញ' : 'tasks match'}
            </span>

            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-neutral-600 hover:text-black hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{language === 'km' ? 'សម្អាតតម្រង' : 'Clear filters'}</span>
              </button>
            )}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-[11px] text-neutral-400 mr-1 flex items-center gap-1 font-medium">
              <Layers className="w-3 h-3" />
              <span>{language === 'km' ? 'ផ្នែក:' : 'Category:'}</span>
            </span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {language === 'km' ? 'ទាំងអស់' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border cursor-pointer ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-brand text-white border-brand font-semibold'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-brand'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-black">
            {isAnyFilterActive
              ? (language === 'km' ? 'រកមិនឃើញកិច្ចការដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ' : 'No tasks match the active search or filters')
              : t.noTasksFound}
          </p>
          {isAnyFilterActive ? (
            <button
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded-lg text-xs font-semibold cursor-pointer border border-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'បង្ហាញកិច្ចការទាំងអស់ឡើងវិញ' : 'Reset all filters'}</span>
            </button>
          ) : isTeamLead ? (
            <button
              onClick={onOpenAssignTask}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.assignNewTask}</span>
            </button>
          ) : null}
        </div>
      ) : (
        <>
        <div className="stagger grid grid-cols-1 md:grid-cols-2 gap-4">
          {view.pageRows.map(task => {
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
                      className="text-xs font-semibold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                      title="Filter by this category"
                    >
                      {task.module}
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] uppercase px-2 py-0.5 rounded-lg border ${priorityBadge.className}`}
                      >
                        {priorityBadge.label}
                      </span>

                      {isTeamLead && (
                        <button
                          onClick={() => {
                            if (confirm(language === 'km' ? 'លុបកិច្ចការនេះ?' : 'Delete this task?')) {
                              deleteTask(task.id);
                            }
                          }}
                          className="text-neutral-400 hover:text-black p-0.5 transition-colors cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

                {task.memberNotes && (
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black">
                    <span className="font-bold block mb-0.5">
                      {language === 'km' ? 'កំណត់សម្គាល់ពីសមាជិក៖' : 'Member notes:'}
                    </span>
                    <span>{task.memberNotes}</span>
                  </div>
                )}

                {task.leaderFeedback && (
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black">
                    <div className="flex items-center gap-1 font-bold mb-0.5">
                      <Award className="w-3.5 h-3.5 text-black" />
                      <span>{t.leaderFeedbackText}:</span>
                    </div>
                    <span>{task.leaderFeedback}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div
                      onClick={() => setAssigneeFilter(assignee.id)}
                      className="flex items-center gap-2 cursor-pointer group"
                      title="Filter by this member"
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

                    <div className="text-right">
                      {editingDeadlineTaskId === task.id && isTeamLead ? (
                        <div className="flex items-center gap-1 bg-white border border-brand rounded-lg p-1 text-xs">
                          <input
                            type="date"
                            value={newDeadlineDate}
                            onChange={e => setNewDeadlineDate(e.target.value)}
                            className="text-[11px] bg-white text-black focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newDeadlineDate) {
                                updateTaskDeadline(task.id, newDeadlineDate);
                              }
                              setEditingDeadlineTaskId(null);
                            }}
                            className="px-1.5 py-0.5 bg-brand text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingDeadlineTaskId(null)}
                            className="text-neutral-400 hover:text-black text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            if (isTeamLead) {
                              setNewDeadlineDate(task.dueDate);
                              setEditingDeadlineTaskId(task.id);
                            }
                          }}
                          className={`flex items-center gap-1.5 justify-end ${
                            isTeamLead ? 'cursor-pointer group/deadline' : ''
                          }`}
                          title={isTeamLead ? 'Click to change task deadline' : undefined}
                        >
                          <Calendar className="w-3.5 h-3.5 text-neutral-500 group-hover/deadline:text-black" />
                          <div>
                            <span className="font-mono text-black font-medium block">
                              {task.dueDate} {task.dueTime}
                              {isTeamLead && <span className="text-[11px] text-neutral-400 ml-1">✎</span>}
                            </span>
                            <span className="text-[11px] font-semibold text-neutral-700">
                              {deadlineInfo.text}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      {task.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>{t.taskStatusApproved}</span>
                        </span>
                      )}
                      {task.status === 'ready_for_review' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-black bg-neutral-200 px-2 py-0.5 rounded-lg border border-neutral-200">
                          <Clock className="w-3.5 h-3.5 text-black" />
                          <span>{t.taskStatusReview}</span>
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-lg">
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
                          <span>{language === 'km' ? 'ចាប់ផ្តើមធ្វើ' : 'Start'}</span>
                        </button>
                      )}
                      {canWorkOnTask && task.status !== 'approved' && task.status !== 'ready_for_review' && (
                        <button
                          onClick={() => setCompletingTaskId(task.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.btnMarkDone}</span>
                        </button>
                      )}

                      {isTeamLead && task.status === 'ready_for_review' && (
                        <button
                          onClick={() => setApprovingTaskId(task.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{t.btnApproveTask}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {completingTaskId === task.id && canWorkOnTask && (
                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-black">
                        <span>{language === 'km' ? 'បញ្ជាក់ការសម្រេចការងារ និងផ្ញើជូនប្រធានត្រួតពិនិត្យ' : 'Submit task completion for Leader review'}</span>
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
                        placeholder="Add a note (optional)"
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
                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-black">
                        <span>{language === 'km' ? 'អនុម័ត និងបញ្ជាក់ទទួលស្គាល់ការងារជោគជ័យ' : 'Leader Sign-off'}</span>
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
                        placeholder="Write feedback (optional)"
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
