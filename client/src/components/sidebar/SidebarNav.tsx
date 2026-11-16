import React, { useLayoutEffect, useRef, useState } from 'react';
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

  // Tooltip is fixed-positioned so the nav's scroll area never clips it or grows a scrollbar
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  const showTip = (label: string) => (e: React.SyntheticEvent<HTMLElement>) => {
    if (!isCollapsed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 8 });
  };
  const hideTip = () => setTip(null);

  // One brand pill slides between items instead of each item flashing its own background
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);
  const [pillReady, setPillReady] = useState(false);

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

  const itemKey = items.map(i => i.id).join();
  useLayoutEffect(() => {
    const measure = () => {
      const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      setPill(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
    };
    measure();
    // Skip the slide on first paint; animate only afterwards
    const raf = requestAnimationFrame(() => setPillReady(true));
    window.addEventListener('resize', measure);
    // Row height changes when the language (line height) or the collapse state changes
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [activeTab, isCollapsed, itemKey]);

  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 [scrollbar-width:thin]">
      <ul ref={listRef} className="relative space-y-1">
        <span
          aria-hidden
          style={{ transform: `translateY(${pill?.top ?? 0}px)`, height: pill?.height ?? 0 }}
          className={`pointer-events-none absolute inset-x-0 top-0 rounded-xl bg-brand shadow-[0_6px_16px_-6px_var(--color-brand)] ${
            pill ? 'opacity-100' : 'opacity-0'
          } ${pillReady ? 'transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]' : ''}`}
        />
        {items.map(({ id, label, icon: Icon, badge }) => {
          const active = activeTab === id;
          return (
            <li key={id} data-active={active} className="relative">
              <button
                type="button"
                onClick={() => onSelect(id)}
                onMouseEnter={showTip(label)}
                onMouseLeave={hideTip}
                onFocus={showTip(label)}
                onBlur={hideTip}
                aria-label={isCollapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group/nav relative z-10 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-brand ${
                  active ? 'text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`size-[18px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    active ? 'scale-110' : 'group-hover/nav:-rotate-6 group-hover/nav:scale-125'
                  }`}
                />
                {!isCollapsed && (
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
        })}
      </ul>

      {isTeamLead && (
        <button
          type="button"
          onClick={onOpenAssignTask}
          title={isCollapsed ? t.assignNewTask : undefined}
          className="group/add mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2.5 text-sm font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:text-white hover:shadow-[0_8px_18px_-8px_var(--color-brand)] focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Icons.add className="size-4 shrink-0 transition-transform duration-300 group-hover/add:rotate-90" />
          {!isCollapsed && <span className="truncate">{t.assignNewTask}</span>}
        </button>
      )}
      {tip && (
        <span
          role="tooltip"
          style={{ top: tip.top, left: tip.left }}
          className="tip-in pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          {tip.label}
        </span>
      )}
    </nav>
  );
};
