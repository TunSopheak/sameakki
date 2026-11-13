import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe, Menu, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useDismiss } from '../lib/useDismiss';
import type { Tab } from './sidebar/SidebarNav';

interface HeaderProps {
  activeTab: Tab;
  onToggleMobileSidebar: () => void;
}

const LANGUAGES = [
  { code: 'km', label: '🇰🇭 ខ្មែរ' },
  { code: 'en', label: '🇬🇧 English' },
] as const;

export const Header: React.FC<HeaderProps> = ({ activeTab, onToggleMobileSidebar }) => {
  const { language, setLanguage, t, activeGroup, searchQuery, setSearchQuery } = useApp();
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
  };
  const groupName = activeGroup ? (language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name) : 'LeaderSync';

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="-ml-2 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-black lg:hidden"
            title="Toggle sidebar"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2 truncate text-xs">
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
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-9 text-xs transition-all hover:bg-neutral-100/80 focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 p-0.5 text-neutral-400 hover:text-black">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div ref={langRef} className="relative shrink-0">
          <button
            onClick={() => setLangOpen(open => !open)}
            className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-100"
            title="Change language"
          >
            <Globe className="size-3.5 text-neutral-500" />
            <span className="font-bold">{language === 'km' ? 'ខ្មែរ' : 'EN'}</span>
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
                  className={`w-full px-3 py-2 text-left font-medium hover:bg-neutral-100 ${
                    language === code ? 'bg-neutral-100 font-bold text-black' : 'text-neutral-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
