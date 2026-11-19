import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, todayLocal } from '../lib/dates';
import { averageProgress, groupTeamTasks, standupToday, taskTotals } from '../lib/stats';
import { statusLabels } from '../lib/taskStatus';
import { AnimatedNumber } from './AnimatedNumber';
import { Avatar } from './Avatar';
import { ActivityLog } from './ActivityLog';
import { cardCount, isOverdue, matchesScope, matchesWhen, myBatches } from '../lib/taskFilters';
import type { PagePreset } from '../lib/pagePreset';
import { Icons } from './icons';
import { StreakBoard } from './StreakBoard';

interface OverviewDashboardProps {
  onGoToTab: (tab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report', preset?: Omit<PagePreset, 'page'>) => void;
  onOpenAssignTask: () => void;
  onOpenAddMember: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onGoToTab,
  onOpenAssignTask,
}) => {
  const {
    activeGroupMembers,
    activeGroupTasks,
    activeGroupDailyLogs,
    currentUser,
    isTeamLead,
    t,
  } = useApp();

  const todayStr = todayLocal();

  const { total: totalTasks, approved: approvedTasks, review: reviewTasks, progress: progressPercent } = taskTotals(activeGroupTasks);

  const submittedTodayLogs = activeGroupDailyLogs.filter(l => l.date === todayStr);
  const { posted: submittedCount, total: posterCount, percent: standupRate } = standupToday(activeGroupMembers, activeGroupDailyLogs, todayStr);
  const totalMemberCount = activeGroupMembers.length;

  const hasUserSubmittedToday = activeGroupDailyLogs.some(
    l => l.userId === currentUser.id && l.date === todayStr
  );

  const openTasks = activeGroupTasks.filter(task => task.status !== 'approved');
  const urgentTasks = groupTeamTasks(openTasks, activeGroupTasks)
    .sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate))
    .slice(0, 3);
  const statusLabel = statusLabels(t);

  // What there is to do today. Just me = my own tasks, with my team = team tasks that include me.
  const mine = myBatches(activeGroupTasks, currentUser.id);
  const none = { from: '', to: '' };
  const runningToday = activeGroupTasks.filter(task => matchesWhen(task, 'today', todayStr, none));
  const todayAlone = cardCount(runningToday.filter(task => matchesScope(task, 'mine', currentUser.id, mine)));
  const todayTeam = cardCount(runningToday.filter(task => matchesScope(task, 'team', currentUser.id, mine)));
  const lateCount = cardCount(activeGroupTasks.filter(task => isOverdue(task, todayStr)));

  // A card that opens a page, optionally already filtered
  const link = (tab: 'tasks' | 'daily' | 'members', preset?: Omit<PagePreset, 'page'>) => ({
    role: 'link' as const,
    tabIndex: 0,
    onClick: () => onGoToTab(tab, preset),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onGoToTab(tab, preset);
      }
    },
  });
  const cardClass = 'lift bg-white p-3.5 sm:p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-brand';
  const todayButton = 'flex min-w-28 flex-1 cursor-pointer items-baseline gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left transition-colors hover:bg-neutral-50 sm:flex-none';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs sm:p-4">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-600">
          <Icons.date className="size-4 text-black" />
          {t.filterToday}
        </span>
        <button type="button" onClick={() => onGoToTab('tasks', { scope: 'mine', when: 'today' })} className={todayButton}>
          <span className="text-xl font-bold text-black font-mono-numbers">{todayAlone}</span>
          <span className="text-xs font-semibold text-neutral-700">{t.filterScopeMine}</span>
        </button>
        <button type="button" onClick={() => onGoToTab('tasks', { scope: 'team', when: 'today' })} className={todayButton}>
          <span className="text-xl font-bold text-black font-mono-numbers">{todayTeam}</span>
          <span className="text-xs font-semibold text-neutral-700">{t.filterScopeTeam}</span>
        </button>
        <button type="button" onClick={() => onGoToTab('tasks', { when: 'overdue' })} className={todayButton}>
          <span className={`text-xl font-bold font-mono-numbers ${lateCount > 0 ? 'text-brand-ink' : 'text-black'}`}>{lateCount}</span>
          <span className="text-xs font-semibold text-neutral-700">{t.filterOverdue}</span>
        </button>
      </div>

      <div className="stagger grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={cardClass} {...link('tasks')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {t.completion}
            </span>
            <Icons.done className="size-4 text-black" />
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-black font-mono-numbers">
                <AnimatedNumber value={progressPercent} suffix="%" />
              </span>
              <span className="text-xs text-neutral-500">
                ({approvedTasks}/{totalTasks} {t.approvedLabel})
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-brand h-full transition-[width] duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className={cardClass} {...link('daily', { when: 'today' })}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {t.todayStandupReport}
            </span>
            <Icons.time className="size-4 text-black" />
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-black font-mono-numbers">
                {submittedCount}/{posterCount}
              </span>
              <span className="text-xs text-neutral-700 font-bold font-mono-numbers">
                ({standupRate}%)
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-2 truncate">
              <span className="inline-flex items-center gap-1">
                {hasUserSubmittedToday ? <Icons.done className="size-3.5 shrink-0" /> : <Icons.warning className="size-3.5 shrink-0" />}
                {hasUserSubmittedToday ? t.standupPostedYes : t.standupPostedNo}
              </span>
            </p>
          </div>
        </div>

        <div className={cardClass} {...link('tasks', { status: 'ready_for_review' })}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {t.pendingVerification}
            </span>
            <Icons.approved className="size-4 text-black" />
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-black font-mono-numbers">
                {reviewTasks}
              </span>
              <span className="text-xs text-neutral-500">
                {t.submittedTasksLabel}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-2">
              {isTeamLead
                ? (t.clickToApprove)
                : (t.awaitingApproval)}
            </p>
          </div>
        </div>

        <div className={cardClass} {...link('members')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {t.tabMembers}
            </span>
            <Icons.members className="size-4 text-black" />
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-black font-mono-numbers">
                {totalMemberCount}
              </span>
              <span className="text-xs text-neutral-500">
                {t.activeMembers}
              </span>
            </div>
            <div className="flex items-center -space-x-1.5 mt-2">
              {activeGroupMembers.slice(0, 5).map(m => (
                <Avatar key={m.id} name={m.name} avatar={m.avatar} className="size-6 ring-2 ring-white" />
              ))}
              {totalMemberCount > 5 && (
                <span className="text-[11px] text-neutral-500 pl-2">
                  +{totalMemberCount - 5}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
                  <Icons.daily className="size-4 text-black" />
                  <span>{t.recentDailyUpdates}</span>
                </h3>
                <p className="hidden text-xs text-neutral-500 sm:block">
                  {t.peerVisibilityNotice}
                </p>
              </div>

              <button
                onClick={() => onGoToTab('daily')}
                className="shrink-0 whitespace-nowrap text-xs font-semibold text-black hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t.viewAll}</span>
                <Icons.forward className="size-3.5" />
              </button>
            </div>

            {submittedTodayLogs.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-xl">
                <Icons.time className="size-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-neutral-700">
                  {t.overviewNoPosts}
                </p>
                <button
                  onClick={() => onGoToTab('daily')}
                  className="mt-3 px-3.5 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark cursor-pointer"
                >
                  {t.btnSubmitDailyLog}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {submittedTodayLogs.slice(0, 3).map(log => {
                  const author = activeGroupMembers.find(m => m.id === log.userId);
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={author?.name ?? 'M'} avatar={author?.avatar} className="size-6" />
                          <span className="font-semibold text-xs text-black">
                            {author?.name}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-black bg-white px-2 py-0.5 rounded-lg">
                          {log.status === 'approved' ? t.taskStatusApproved : log.status === 'completed' ? t.taskStatusReview : t.taskStatusInProgress}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-800 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-black">[{log.title}]: </span>
                        {log.rawContent}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-black tracking-tight flex items-center gap-1.5">
                <Icons.date className="size-4 text-black" />
                <span>{t.upcomingTasks}</span>
              </h3>

              <button
                onClick={() => onGoToTab('tasks')}
                className="shrink-0 whitespace-nowrap text-xs font-semibold text-black hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t.viewAll}</span>
                <Icons.forward className="size-3.5" />
              </button>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-lg">
                {t.allTasksDone}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {urgentTasks.map(({ task, team }) => {
                  const assignee = activeGroupMembers.find(m => m.id === task.assignedTo);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-neutral-50 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[11px] uppercase tracking-wider text-black">
                          {task.module}
                        </span>
                        <span className="font-mono-numbers text-[11px] text-neutral-500">
                          {task.dueDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-black truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-1">
                        <span>{team ? `${t.teamTask} · ${t.teamTaskPeople.replace('{n}', String(team.length))}` : assignee?.name}</span>
                        <span className="font-semibold text-black">{team ? `${averageProgress(team)}%` : statusLabel[task.status]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isTeamLead && (
              <button
                onClick={onOpenAssignTask}
                className="w-full mt-4 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-200"
              >
                <Icons.add className="size-3.5" />
                <span>{t.assignNewTask}</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <StreakBoard />
        </div>
      </div>

      <ActivityLog />
    </div>
  );
};
