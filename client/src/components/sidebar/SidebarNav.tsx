import React from 'react';
import { useApp } from '../../context/AppContext';
import { todayLocal } from '../../lib/dates';
import { Icons } from '../icons';

export type Tab = 'dashboard' | 'tasks' | 'daily' | 'members' | 'report' | 'admin';

interface SidebarNavProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  isCollapsed: boolean;
  onOpenAssignTask: () => void;
}

const Badge: React.FC<{ children: React.ReactNode; strong?: boolean; active: boolean }> = ({ children, strong, active }) => (
  <span
    className={`rounded-md px-1.5 py-px text-xs font-semibold ${
      active ? 'bg-white/20 text-white' : strong ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'
    }`}
  >
    {children}
  </span>
);

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onSelect, isCollapsed, onOpenAssignTask }) => {
  const { t, isTeamLead, isSuperAdmin, currentUser, activeGroupTasks, activeGroupMembers, activeGroupDailyLogs } = useApp();

  const today = todayLocal();
  const postedToday = new Set(activeGroupDailyLogs.filter(l => l.date === today).map(l => l.userId));
  const pendingReview = activeGroupTasks.filter(task => task.status === 'ready_for_review').length;

  const items: { id: Tab; label: string; icon: React.ElementType; badge?: { text: string; strong?: boolean } }[] = [
    { id: 'dashboard', label: t.tabDashboard, icon: Icons.home },
    {
      id: 'daily',
      label: t.tabDailyLogs,
      icon: Icons.daily,
      badge: { text: `${postedToday.size}/${activeGroupMembers.length}`, strong: !postedToday.has(currentUser.id) },
    },
    {
      id: 'tasks',
      label: t.tabTasks,
      icon: Icons.tasks,
      badge: pendingReview > 0 ? { text: String(pendingReview), strong: true } : undefined,
    },
    { id: 'members', label: t.tabMembers, icon: Icons.members, badge: { text: String(activeGroupMembers.length) } },
    { id: 'report', label: t.tabReport, icon: Icons.report },
    ...(isSuperAdmin ? [{ id: 'admin' as const, label: t.tabAdmin, icon: Icons.admin }] : []),
  ];

  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="space-y-1">
        {items.map(({ id, label, icon: Icon, badge }) => {
          const active = activeTab === id;
          return (
            <li key={id} className="group/item relative">
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-brand ${
                  active ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`size-[18px] shrink-0 transition-transform duration-150 ${active ? '' : 'group-hover/item:scale-110'}`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{label}</span>
                    {badge && (
                      <Badge strong={badge.strong} active={active}>
                        {badge.text}
                      </Badge>
                    )}
                  </>
                )}
              </button>
              {isCollapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/item:opacity-100"
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {isTeamLead && (
        <button
          type="button"
          onClick={onOpenAssignTask}
          title={isCollapsed ? t.assignNewTask : undefined}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Icons.add className="size-4 shrink-0" />
          {!isCollapsed && <span className="truncate">{t.assignNewTask}</span>}
        </button>
      )}
    </nav>
  );
};
