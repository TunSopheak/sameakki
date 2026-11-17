import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { todayLocal } from '../../lib/dates';
import { standupToday } from '../../lib/stats';
import { useActivePill } from '../../lib/useActivePill';
import { useSideTooltip } from '../../lib/useSideTooltip';
import { Icons } from '../icons';
import { NavTooltip } from './NavTooltip';

export type Tab = 'dashboard' | 'tasks' | 'daily' | 'members' | 'report' | 'guide' | 'admin';

interface SidebarNavProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  isCollapsed: boolean;
  onOpenAssignTask: () => void;
}

interface NavBadge {
  text: string;
  strong?: boolean;
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

interface NavItemProps {
  label: string;
  icon: React.ElementType;
  badge?: NavBadge;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  tooltip: Record<'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur', React.EventHandler<React.SyntheticEvent<HTMLElement>>>;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon: Icon, badge, active, collapsed, onClick, tooltip }) => (
  <li data-active={active} className="relative">
    <button
      type="button"
      onClick={onClick}
      {...tooltip}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group/nav relative z-10 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-brand ${
        active ? 'text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon
        className={`size-[18px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          active ? 'scale-110' : 'group-hover/nav:-rotate-6 group-hover/nav:scale-125'
        }`}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left transition-transform duration-200 group-hover/nav:translate-x-0.5">{label}</span>
          {badge && (
            <Badge strong={badge.strong} active={active}>
              {badge.text}
            </Badge>
          )}
        </>
      )}
    </button>
  </li>
);

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onSelect, isCollapsed, onOpenAssignTask }) => {
  const { t, isTeamLead, isSuperAdmin, currentUser, activeGroupTasks, activeGroupMembers, activeGroupDailyLogs } = useApp();
  const listRef = useRef<HTMLUListElement>(null);
  const { tip, show, hide } = useSideTooltip(isCollapsed);

  const standup = standupToday(activeGroupMembers, activeGroupDailyLogs, todayLocal());
  const canPost = currentUser.role !== 'viewer';
  const pendingReview = activeGroupTasks.filter(task => task.status === 'ready_for_review').length;

  const items: { id: Tab; label: string; icon: React.ElementType; badge?: NavBadge }[] = [
    { id: 'dashboard', label: t.tabDashboard, icon: Icons.home },
    {
      id: 'daily',
      label: t.tabDailyLogs,
      icon: Icons.daily,
      badge: { text: `${standup.posted}/${standup.total}`, strong: canPost && !standup.postedIds.has(currentUser.id) },
    },
    {
      id: 'tasks',
      label: t.tabTasks,
      icon: Icons.tasks,
      badge: pendingReview > 0 ? { text: String(pendingReview), strong: true } : undefined,
    },
    { id: 'members', label: t.tabMembers, icon: Icons.members, badge: { text: String(activeGroupMembers.length) } },
    { id: 'report', label: t.tabReport, icon: Icons.report },
    { id: 'guide', label: t.tabGuide, icon: Icons.guide },
    ...(isSuperAdmin ? [{ id: 'admin' as const, label: t.tabAdmin, icon: Icons.admin }] : []),
  ];

  const { pill, ready } = useActivePill(listRef, [activeTab, isCollapsed, items.length]);

  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 [scrollbar-width:thin]">
      <ul ref={listRef} className="relative space-y-1">
        <span
          aria-hidden
          style={{ transform: `translateY(${pill?.top ?? 0}px)`, height: pill?.height ?? 0 }}
          className={`pointer-events-none absolute inset-x-0 top-0 rounded-xl bg-brand shadow-[0_6px_16px_-6px_var(--color-brand)] ${
            pill ? 'opacity-100' : 'opacity-0'
          } ${ready ? 'transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]' : ''}`}
        />
        {items.map(item => (
          <NavItem
            key={item.id}
            {...item}
            active={activeTab === item.id}
            collapsed={isCollapsed}
            onClick={() => onSelect(item.id)}
            tooltip={{ onMouseEnter: show(item.label), onMouseLeave: hide, onFocus: show(item.label), onBlur: hide }}
          />
        ))}
      </ul>

      {isTeamLead && (
        <button
          type="button"
          onClick={onOpenAssignTask}
          title={isCollapsed ? t.assignNewTask : undefined}
          className="group/add mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2.5 text-sm font-semibold text-brand-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:text-white hover:shadow-[0_8px_18px_-8px_var(--color-brand)] focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Icons.add className="size-4 shrink-0 transition-transform duration-300 group-hover/add:rotate-90" />
          {!isCollapsed && <span className="truncate">{t.assignNewTask}</span>}
        </button>
      )}
      <NavTooltip tip={tip} />
    </nav>
  );
};
