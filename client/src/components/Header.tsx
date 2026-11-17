import React from 'react';
import { useApp } from '../context/AppContext';
import { LanguageToggle } from './LanguageToggle';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import type { Tab } from './sidebar/SidebarNav';
import { APP_NAME } from '../lib/brand';

interface HeaderProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate }) => {
  const { language, t, activeGroup } = useApp();

  const tabTitles: Record<Tab, string> = {
    dashboard: t.tabDashboard,
    daily: t.tabDailyLogs,
    tasks: t.tabTasks,
    members: t.tabMembers,
    report: t.tabReport,
    guide: t.tabGuide,
    admin: t.tabAdmin,
  };
  const groupName = activeGroup ? (language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name) : APP_NAME;

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            aria-label={APP_NAME}
            title={APP_NAME}
            className="shrink-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
          >
            <Logo className="size-9 text-black" />
          </button>
          <div className="hidden items-center gap-2 truncate text-xs sm:flex">
            <span className="max-w-44 truncate font-bold text-black sm:max-w-64">{groupName}</span>
            <span className="hidden text-neutral-400 sm:inline">/</span>
            <span className="hidden truncate font-semibold text-neutral-600 sm:inline">{tabTitles[activeTab]}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
        <NotificationBell onNavigate={onNavigate} />
        <ThemeToggle className="size-10 rounded-xl border border-neutral-200 bg-white" />

        <LanguageToggle />
        </div>
      </div>
    </header>
  );
};
