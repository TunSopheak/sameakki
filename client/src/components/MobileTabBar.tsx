import React from 'react';
import { useApp } from '../context/AppContext';
import { useHideOnScroll } from '../lib/useHideOnScroll';
import type { Tab } from './sidebar/SidebarNav';
import { Icons } from './icons';

interface MobileTabBarProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onOpenMenu: () => void;
}

const tap = () => navigator.vibrate?.(8);

/** Floating bottom tabs on phones. */
export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onSelect, onOpenMenu }) => {
  const { t } = useApp();
  const [hidden, show] = useHideOnScroll();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: t.navHome, icon: Icons.home },
    { id: 'daily', label: t.navDaily, icon: Icons.daily },
    { id: 'tasks', label: t.navTasks, icon: Icons.tasks },
    { id: 'members', label: t.navMembers, icon: Icons.members },
  ];
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  const item =
    'group relative z-10 flex min-w-0 cursor-pointer flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-brand';
  const iconClass = 'size-5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

  return (
    <nav
      aria-label="Tabs"
      onFocus={show}
      className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
        hidden ? 'translate-y-[calc(100%+1.5rem)]' : 'translate-y-0'
      }`}
    >
      <div className="relative grid grid-cols-5 rounded-2xl border border-neutral-200/80 bg-white/85 p-1 shadow-[0_10px_30px_-8px_rgb(26_20_16/0.28)] backdrop-blur-xl">
        <span
          aria-hidden
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
          className={`pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/5)] rounded-xl bg-brand-soft transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
            activeIndex >= 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-brand" />
        </span>

        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                tap();
                onSelect(id);
              }}
              aria-current={active ? 'page' : undefined}
              className={`${item} ${active ? 'text-brand-ink' : 'text-neutral-500'}`}
            >
              <Icon className={`${iconClass} ${active ? '-translate-y-0.5 scale-110' : 'group-active:scale-90'}`} />
              <span className={`w-full truncate text-center transition-[font-weight] ${active ? 'font-bold' : ''}`}>{label}</span>
            </button>
          );
        })}

        <button
          onClick={() => {
            tap();
            onOpenMenu();
          }}
          className={`${item} text-neutral-500`}
        >
          <Icons.menu className={`${iconClass} group-active:scale-90`} />
          <span className="w-full truncate text-center">{t.navMenu}</span>
        </button>
      </div>
    </nav>
  );
};
