import React, { useEffect, useRef } from 'react';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Brand } from './Brand';
import { GroupSwitcher } from './sidebar/GroupSwitcher';
import { SidebarNav, type Tab } from './sidebar/SidebarNav';
import { UserMenu } from './sidebar/UserMenu';
import { Icons } from './icons';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenAssignTask: () => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
}

const iconButton =
  'rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-black focus-visible:outline-2 focus-visible:outline-brand';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenAssignTask,
  onOpenCreateGroup,
  onOpenJoinGroup,
}) => {
  const { t } = useApp();
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileOpen, setIsMobileOpen]);

  const select = (tab: Tab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {isMobileOpen && (
        <div className="modal-overlay fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside
        aria-label="Sidebar"
        onTouchStart={e => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={e => {
          // Swipe left on the drawer to close it
          if (touchX.current !== null && touchX.current - e.changedTouches[0].clientX > 60) setIsMobileOpen(false);
          touchX.current = null;
        }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white transition-[width,transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Collapse toggle sits on the sidebar edge so the header stays clean */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-5 z-10 hidden size-6 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-xs transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand lg:flex"
        >
          {isCollapsed ? <PanelLeft className="size-3" /> : <PanelLeftClose className="size-3" />}
        </button>

        <header
          className={`flex h-16 shrink-0 items-center border-b border-neutral-100 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4'
          }`}
        >
          <Brand short iconOnly={isCollapsed} onClick={() => select('dashboard')} />
          <button type="button" onClick={() => setIsMobileOpen(false)} aria-label={t.close} className={`lg:hidden ${iconButton}`}>
            <Icons.close className="size-4" />
          </button>
        </header>

        <GroupSwitcher isCollapsed={isCollapsed} onOpenCreateGroup={onOpenCreateGroup} onOpenJoinGroup={onOpenJoinGroup} />
        <SidebarNav activeTab={activeTab} onSelect={select} isCollapsed={isCollapsed} onOpenAssignTask={onOpenAssignTask} />
        <UserMenu isCollapsed={isCollapsed} />
      </aside>
    </>
  );
};
