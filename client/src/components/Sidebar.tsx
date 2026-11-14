import React from 'react';
import { PanelLeft, PanelLeftClose, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Brand } from './Brand';
import { GroupSwitcher } from './sidebar/GroupSwitcher';
import { SidebarNav, type Tab } from './sidebar/SidebarNav';
import { UserMenu } from './sidebar/UserMenu';

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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white transition-[width,transform] duration-200 ease-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <header
          className={`flex shrink-0 items-center border-b border-neutral-100 px-4 ${
            isCollapsed ? 'flex-col justify-center gap-1 py-3' : 'h-16 justify-between gap-2'
          }`}
        >
          <Brand short iconOnly={isCollapsed} />
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden lg:block ${iconButton}`}
          >
            {isCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
          <button type="button" onClick={() => setIsMobileOpen(false)} aria-label={t.close} className={`lg:hidden ${iconButton}`}>
            <X className="size-4" />
          </button>
        </header>

        <GroupSwitcher isCollapsed={isCollapsed} onOpenCreateGroup={onOpenCreateGroup} onOpenJoinGroup={onOpenJoinGroup} />
        <SidebarNav activeTab={activeTab} onSelect={select} isCollapsed={isCollapsed} onOpenAssignTask={onOpenAssignTask} />
        <UserMenu isCollapsed={isCollapsed} />
      </aside>
    </>
  );
};
