import React, { useRef, useState } from 'react';
import { ChevronsUpDown, Info, LogOut, Settings, Smile } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { navigate } from '../../lib/route';
import { useDismiss } from '../../lib/useDismiss';
import { Avatar } from '../Avatar';
import { AvatarPickerModal } from '../AvatarPickerModal';
import { ProfileModal } from '../ProfileModal';

const ROLE_LABEL = { super_admin: 'Admin', team_lead: 'Lead', member: 'Member', viewer: 'Viewer' } as const;

export const UserMenu: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { currentUser, logout, language, t } = useApp();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const displayName = language === 'km' && currentUser.nameKm ? currentUser.nameKm : currentUser.name;

  return (
    <div ref={ref} className="relative border-t border-neutral-100 p-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={isCollapsed ? displayName : undefined}
        className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <Avatar name={currentUser.name} avatar={currentUser.avatar} className="size-9" />
        {!isCollapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-black">{displayName}</span>
              <span className="mt-0.5 inline-block rounded-md bg-brand-soft px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide text-brand">
                {ROLE_LABEL[currentUser.role]}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-neutral-400" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-3 z-50 mb-1 w-60 animate-[fadeIn_120ms_ease-out] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl"
        >
          <div className="border-b border-neutral-100 px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold text-black">{currentUser.name}</p>
            <p className="truncate text-xs text-neutral-500">{currentUser.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setProfileOpen(true);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100"
          >
            <Settings className="size-4 text-neutral-500" />
            {t.mySettings}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPickerOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100"
          >
            <Smile className="size-4 text-neutral-500" />
            {t.changeAvatar}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/about');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100"
          >
            <Info className="size-4 text-neutral-500" />
            {t.aboutApp}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100"
          >
            <LogOut className="size-4 text-neutral-500" />
            {t.signOut}
          </button>
        </div>
      )}
      <AvatarPickerModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};
