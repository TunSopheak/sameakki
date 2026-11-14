import React from 'react';
import { useApp } from '../context/AppContext';
import type { Tab } from './sidebar/SidebarNav';
import { Icons } from './icons';

interface MobileTabBarProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onOpenMenu: () => void;
}

/** Bottom tabs on phones. */
export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onSelect, onOpenMenu }) => {
  const { t } = useApp();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: t.navHome, icon: Icons.home },
    { id: 'daily', label: t.navDaily, icon: Icons.daily },
    { id: 'tasks', label: t.navTasks, icon: Icons.tasks },
    { id: 'members', label: t.navMembers, icon: Icons.members },
  ];

  const item = 'relative flex min-w-0 flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 text-[11px] font-medium transition-colors';

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            aria-current={active ? 'page' : undefined}
            className={`${item} ${active ? 'text-brand' : 'text-neutral-500'}`}
          >
            {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-b bg-brand" />}
            <Icon className="size-5" />
            <span className="w-full truncate text-center">{label}</span>
          </button>
        );
      })}
      <button onClick={onOpenMenu} className={`${item} text-neutral-500`}>
        <Icons.menu className="size-5" />
        <span className="w-full truncate text-center">{t.navMenu}</span>
      </button>
    </nav>
  );
};
