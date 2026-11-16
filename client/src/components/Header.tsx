import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useDismiss } from '../lib/useDismiss';
import { Flag } from './Flag';
import { Icons } from './icons';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import type { Tab } from './sidebar/SidebarNav';
import { APP_NAME } from '../lib/brand';

interface HeaderProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
}

const LANGUAGES = [
  { code: 'km', label: 'ខ្មែរ' },
  { code: 'en', label: 'English' },
] as const;

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate }) => {
  const { language, setLanguage, t, activeGroup } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  useDismiss(langRef, langOpen, () => setLangOpen(false));

  const tabTitles: Record<Tab, string> = {
    dashboard: t.tabDashboard,
    daily: t.tabDailyLogs,
    tasks: t.tabTasks,
    members: t.tabMembers,
    report: t.tabReport,
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

        <div ref={langRef} className="relative shrink-0">
          <button
            onClick={() => setLangOpen(open => !open)}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-100"
            title={t.changeLanguage}
          >
            <Flag code={language} className="h-4" />
            <span className="hidden font-bold sm:inline">{language === 'km' ? 'ខ្មែរ' : 'EN'}</span>
            <Icons.expand className="size-3 text-neutral-400" />
          </button>
          {langOpen && (
            <div className="absolute right-0 z-50 mt-1 w-36 rounded-xl border border-neutral-200 bg-white py-1 text-xs shadow-xl">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code);
                    setLangOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium hover:bg-neutral-100 ${
                    language === code ? 'bg-neutral-100 font-bold text-black' : 'text-neutral-700'
                  }`}
                >
                  <Flag code={code} className="h-4" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
};
