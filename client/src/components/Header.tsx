import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Moon, Search, Sun, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../lib/theme';
import { useDismiss } from '../lib/useDismiss';
import { Flag } from './Flag';
import { Logo } from './Logo';
import type { Tab } from './sidebar/SidebarNav';

interface HeaderProps {
  activeTab: Tab;
}

const LANGUAGES = [
  { code: 'km', label: 'ខ្មែរ' },
  { code: 'en', label: 'English' },
] as const;

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { language, setLanguage, t, activeGroup, searchQuery, setSearchQuery } = useApp();
  const { theme, toggle } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  useDismiss(langRef, langOpen, () => setLangOpen(false));

  // Ctrl/Cmd + K focuses the search box
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const tabTitles: Record<Tab, string> = {
    dashboard: t.tabDashboard,
    daily: t.tabDailyLogs,
    tasks: t.tabTasks,
    members: t.tabMembers,
    report: t.tabReport,
    admin: t.tabAdmin,
  };
  const groupName = activeGroup ? (language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name) : 'LeaderSync';

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Logo className="size-9 shrink-0 text-black lg:hidden" />
          <div className="hidden items-center gap-2 truncate text-xs sm:flex">
            <span className="max-w-44 truncate font-bold text-black sm:max-w-64">{groupName}</span>
            <span className="hidden text-neutral-400 sm:inline">/</span>
            <span className="hidden truncate font-semibold text-neutral-600 sm:inline">{tabTitles[activeTab]}</span>
          </div>
        </div>

        <div className="relative mx-2 flex max-w-xs flex-1 items-center sm:max-w-md lg:max-w-lg">
          <Search className="pointer-events-none absolute left-3 size-3.5 text-neutral-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'km' ? 'ស្វែងរក...' : 'Search...'}
            className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-9 text-sm sm:text-xs transition-all hover:bg-neutral-100/80 focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 p-0.5 text-neutral-400 hover:text-black">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={toggle}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <div ref={langRef} className="relative shrink-0">
          <button
            onClick={() => setLangOpen(open => !open)}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-100"
            title="Change language"
          >
            <Flag code={language} className="h-4" />
            <span className="hidden font-bold sm:inline">{language === 'km' ? 'ខ្មែរ' : 'EN'}</span>
            <ChevronDown className="size-3 text-neutral-400" />
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
