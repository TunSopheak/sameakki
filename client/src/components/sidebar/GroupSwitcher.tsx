import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDismiss } from '../../lib/useDismiss';
import { Icons } from '../icons';

interface GroupSwitcherProps {
  isCollapsed: boolean;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
}

export const GroupSwitcher: React.FC<GroupSwitcherProps> = ({ isCollapsed, onOpenCreateGroup, onOpenJoinGroup }) => {
  const { groups, activeGroup, activeGroupMembers, setActiveGroupId, canCreateGroup, language, t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const groupName = (g: { name: string; nameKm?: string }) => (language === 'km' && g.nameKm ? g.nameKm : g.name);
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={ref} className="relative p-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={isCollapsed ? (activeGroup ? groupName(activeGroup) : t.switchGroup) : undefined}
        className={`flex w-full items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-xs font-bold text-white">
          {activeGroup ? activeGroup.name.charAt(0).toUpperCase() : <Icons.add className="size-4" />}
        </span>
        {!isCollapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-black">
                {activeGroup ? groupName(activeGroup) : t.switchGroup}
              </span>
              {activeGroup && (
                <span className="block truncate text-xs text-neutral-500">
                  {activeGroupMembers.length} {t.membersUnit}
                </span>
              )}
            </span>
            <Icons.switcher className="size-4 shrink-0 text-neutral-400" />
          </>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-3 top-full z-50 mt-1 w-64 animate-[fadeIn_120ms_ease-out] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-neutral-500">{t.switchGroup}</p>
          <ul className="max-h-56 overflow-y-auto">
            {groups.map(group => {
              const selected = group.id === activeGroup?.id;
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={run(() => setActiveGroupId(group.id))}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-neutral-100"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-black">{groupName(group)}</span>
                      <span className="block truncate text-xs text-neutral-500">{group.courseOrProject}</span>
                    </span>
                    {selected && <Icons.confirm className="size-4 shrink-0 text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 space-y-1 border-t border-neutral-100 pt-1.5">
            <button
              type="button"
              onClick={run(onOpenJoinGroup)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100"
            >
              <Icons.password className="size-4 text-neutral-500" />
              {t.joinGroup}
            </button>
            {canCreateGroup && (
              <button
                type="button"
                onClick={run(onOpenCreateGroup)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
              >
                <Icons.add className="size-4" />
                {t.createGroup}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
